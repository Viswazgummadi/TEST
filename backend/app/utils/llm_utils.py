# backend/app/utils/llm_utils.py

import os
import json
from flask import current_app
from langchain_google_genai import ChatGoogleGenerativeAI, HarmBlockThreshold, HarmCategory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder 
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from sqlalchemy.orm.exc import NoResultFound

from ..schemas.user_schema import UserFactSchema, UserFactsList, RepoSummarySchema # NEW: Import RepoSummarySchema

from ..models.models import db, ConfiguredModel, APIKey, ChatHistory, RepoConversationSummary, UserFact
from .auth import decrypt_value

def _get_llm_for_utility_tasks():
    # ... (keep this function exactly as it is from the previous full code block)
    """
    Helper function to initialize an LLM for internal utility tasks like summarization.
    It uses the 'gemini-1.5-flash' model and retrieves the API key from ConfiguredModel or environment.
    """
    with current_app.app_context(): # Ensure we are in Flask app context for db access
        llm_api_key = None
        llm_model_id = "gemini-1.5-flash" # Default model for internal tasks

        current_app.logger.info("Celery Task (Internal LLM Init): Attempting to get LLM API key.")

        # 1. Try to get API key from configured models (prefer 'Gemini-API-Key' service name if exists)
        try:
            gemini_api_key_entry = db.session.query(APIKey).filter_by(service_name="Gemini-API-Key").first()
            if gemini_api_key_entry:
                llm_api_key = decrypt_value(gemini_api_key_entry.key_value_encrypted)
                if not llm_api_key:
                    current_app.logger.warning("Celery Task (Internal LLM Init): Failed to decrypt 'Gemini-API-Key' from DB.")
                else:
                    current_app.logger.info("Celery Task (Internal LLM Init): Successfully retrieved API key from DB.")
            else:
                current_app.logger.info("Celery Task (Internal LLM Init): 'Gemini-API-Key' entry not found in DB APIKeys.")
        except Exception as e:
            current_app.logger.error(f"Celery Task (Internal LLM Init): Error retrieving/decrypting DB API key: {e}", exc_info=True)
            llm_api_key = None # Ensure it's None if there was an error

        # 2. Fallback to environment variable if not found or decryption failed
        if not llm_api_key:
            llm_api_key = os.environ.get("GEMINI_API_KEY")
            if not llm_api_key:
                current_app.logger.error("Celery Task (Internal LLM Init): GEMINI_API_KEY not found in configured APIKeys or environment variables.")
                raise ValueError("GEMINI_API_KEY not found for LLM utility tasks.")
            else:
                current_app.logger.info("Celery Task (Internal LLM Init): Successfully retrieved API key from environment.")
        
        # Check if the model is configured and active, otherwise default to "gemini-1.5-flash"
        configured_model = db.session.query(ConfiguredModel).filter_by(model_id_string=llm_model_id, is_active=True).first()
        if not configured_model:
            current_app.logger.warning(f"Celery Task (Internal LLM Init): Default LLM '{llm_model_id}' not found or active in ConfiguredModels. Using it directly with provided key.")

        llm = ChatGoogleGenerativeAI(
            model=llm_model_id,
            google_api_key=llm_api_key,
            temperature=0.3, # Consistent temperature
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            },
        )
        current_app.logger.info(f"Celery Task (Internal LLM Init): LLM initialized with model {llm_model_id}.")
        return llm


def generate_repo_summary(user_id: str, data_source_id: str, new_messages_only: bool = True):
    """
    Generates or updates a concise summary of the conversation for a specific
    user and data source.
    """
    current_app.logger.info(f"Celery Task (Internal): Starting repo summary generation for user {user_id}, data source {data_source_id}.")
    
    with current_app.app_context(): # Ensure we are in Flask app context for db access
        repo_summary_entry = db.session.query(RepoConversationSummary).filter_by(
            user_id=user_id,
            data_source_id=data_source_id
        ).first()

        existing_summary_text = repo_summary_entry.summary_text if repo_summary_entry else ""
        last_timestamp_summarized = repo_summary_entry.last_message_timestamp if repo_summary_entry else None

        query = db.session.query(ChatHistory).filter_by(
            user_id=user_id,
            data_source_id=data_source_id
        ).order_by(ChatHistory.timestamp.asc())

        if new_messages_only and last_timestamp_summarized:
            messages_to_summarize = query.filter(ChatHistory.timestamp > last_timestamp_summarized).all()
        else:
            messages_to_summarize = query.all()

        if not messages_to_summarize:
            current_app.logger.info("Celery Task (Internal): No new messages to summarize for this repo. Skipping summary update.")
            return existing_summary_text

        messages_for_llm = []
        if existing_summary_text:
            messages_for_llm.append(SystemMessage(content=f"Previous conversation summary: {existing_summary_text}"))
        
        for msg in messages_to_summarize:
            if msg.message_content and msg.message_content.strip():
                if msg.sender == 'user':
                    messages_for_llm.append(HumanMessage(content=msg.message_content))
                elif msg.sender == 'llm':
                    messages_for_llm.append(AIMessage(content=msg.message_content))
        
        if not messages_for_llm:
            current_app.logger.warning("Celery Task (Internal): No messages (even if new_messages_only=False) found for summarization after filtering. This should not happen if messages_to_summarize is not empty.")
            return existing_summary_text

        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=(
                "You are a summarization assistant. Summarize the following conversation, focusing on key questions, answers, decisions, and knowledge gained about the codebase."
                "If a previous summary is provided, integrate the new turns into that summary to create an updated, concise, and coherent summary of the entire conversation."
                "Your summary should be no more than 200 words and should be highly relevant to understanding the code or features discussed."
                "If the conversation has NOT included any discussion of a codebase or technical details relevant to a project, your summary should explicitly state that."
                "For example: 'No codebase or technical details discussed yet, conversation is focused on introductions.' or 'Conversation is about general topics, no project summary available.'"
            )),
            MessagesPlaceholder(variable_name="chat_history"),
        ])

        llm = _get_llm_for_utility_tasks()
        # NEW: Use with_structured_output for the summary
        structured_llm = llm.with_structured_output(RepoSummarySchema)
        summarization_chain = prompt | structured_llm

        try:
            current_app.logger.info(f"Celery Task (Internal): Invoking LLM for summarization with {len(messages_for_llm)} messages.")
            # The invoke call will now return a RepoSummarySchema Pydantic object
            structured_response: RepoSummarySchema = summarization_chain.invoke(
                {"chat_history": messages_for_llm}, 
                config={"timeout": 60}
            )
            
            new_summary_text = structured_response.summary # Access summary directly from Pydantic object

            current_app.logger.info(f"Celery Task (Internal): Generated new summary (length: {len(new_summary_text)}). Content: {new_summary_text[:100]}...")
            
            if not new_summary_text.strip(): # This check might become less frequent with structured output
                current_app.logger.warning("Celery Task (Internal): LLM returned empty or whitespace-only summary (even with structured output). Using existing or default.")
                new_summary_text = existing_summary_text

            if repo_summary_entry:
                repo_summary_entry.summary_text = new_summary_text
                repo_summary_entry.last_message_timestamp = messages_to_summarize[-1].timestamp
            else:
                repo_summary_entry = RepoConversationSummary(
                    user_id=user_id,
                    data_source_id=data_source_id,
                    summary_text=new_summary_text,
                    last_message_timestamp=messages_to_summarize[-1].timestamp
                )
                db.session.add(repo_summary_entry)
            db.session.commit()
            current_app.logger.info(f"Celery Task (Internal): Repo summary updated for user {user_id}, data source {data_source_id}.")
            return new_summary_text

        except Exception as e:
            current_app.logger.error(f"Celery Task (Internal): Error during repo summary generation for {user_id}/{data_source_id}: {e}", exc_info=True)
            db.session.rollback()
            return existing_summary_text

# ... (keep extract_user_facts function exactly as it is from the previous full code block)

def extract_user_facts(user_id: str, new_messages_only: bool = True):
    """
    Extracts general facts about the user from their recent conversations and stores them.
    """
    current_app.logger.info(f"Celery Task (Internal): Starting user fact extraction for user {user_id}.")

    with current_app.app_context():
        all_user_messages = db.session.query(ChatHistory).filter_by(
            user_id=user_id
        ).order_by(ChatHistory.timestamp.asc()).all()

        if not all_user_messages:
            current_app.logger.info("Celery Task (Internal): No user messages found for fact extraction.")
            return

        messages_for_llm = []
        for msg in all_user_messages:
            if msg.message_content and msg.message_content.strip():
                if msg.sender == 'user':
                    messages_for_llm.append(HumanMessage(content=msg.message_content))
                elif msg.sender == 'llm':
                    messages_for_llm.append(AIMessage(content=msg.message_content))
        
        if not messages_for_llm:
            current_app.logger.warning("Celery Task (Internal): No substantial messages found for fact extraction after filtering. Skipping.")
            return

        prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content=(
                "You are an expert system designed to build a personal 'second brain' for the user by extracting concise, general facts about them from their conversation history."
                "Your primary goal is to identify and list any personal facts or strong preferences about the user that are NOT specific to a particular codebase or technical discussion."
                "This information is crucial for providing a highly personalized and context-aware experience to the user within Reploit."
                "It is **essential** that you extract explicit details like the user's name, role (e.g., 'student', 'engineer'), current affiliation (e.g., 'IITDH'), preferred tools, or specific hobbies if they are stated by the user."
                "DO NOT include conversational filler, greetings, questions/answers directly about the code, or generic statements that aren't specific facts about *this* user."
                "If no relevant or new facts are found after careful analysis, return an empty list of facts according to the schema."
                "Do not include conversational filler, greetings, questions/answers directly about the code, or generic statements."
                "Prioritize the most recent and relevant facts."
                "Consider even single-turn statements as potential facts if they directly reveal personal information."
            )),
            MessagesPlaceholder(variable_name="chat_history"),
        ])

        llm = _get_llm_for_utility_tasks()
        structured_llm = llm.with_structured_output(UserFactsList) 
        fact_extraction_chain = prompt | structured_llm

        try:
            current_app.logger.info(f"Celery Task (Internal): Invoking LLM for fact extraction with {len(messages_for_llm)} messages.")
            
            structured_response: UserFactsList = fact_extraction_chain.invoke(
                {"chat_history": messages_for_llm}, 
                config={"timeout": 60}
            )
            
            extracted_facts = structured_response.facts 
            
            current_app.logger.info(f"Celery Task (Internal): Extracted facts (Pydantic) [repr]: {repr(extracted_facts)}") 
            current_app.logger.info(f"Celery Task (Internal): Extracted facts (Pydantic) [normal]: {extracted_facts}")
            
            if not extracted_facts: 
                current_app.logger.info(f"Celery Task (Internal): No facts extracted for user {user_id} (empty list returned by LLM).")
                return 

            for fact in extracted_facts: 
                if isinstance(fact, UserFactSchema): 
                    user_fact_entry = db.session.query(UserFact).filter_by(
                        user_id=user_id,
                        fact_key=fact.fact_key 
                    ).first()
                    if user_fact_entry:
                        if user_fact_entry.fact_value != fact.fact_value: 
                            user_fact_entry.fact_value = fact.fact_value 
                            current_app.logger.info(f"Celery Task (Internal): Updated user fact: {fact.fact_key} = {fact.fact_value}")
                    else:
                        new_fact = UserFact(
                            user_id=user_id,
                            fact_key=fact.fact_key, 
                            fact_value=fact.fact_value 
                        )
                        db.session.add(new_fact)
                        current_app.logger.info(f"Celery Task (Internal): Added new user fact: {fact.fact_key} = {fact.fact_value}")
                else:
                    current_app.logger.warning(f"Celery Task (Internal): Encountered non-UserFactSchema object in extracted facts: {repr(fact)}. Skipping.")

            db.session.commit()
            current_app.logger.info(f"Celery Task (Internal): User facts updated for user {user_id}. Found {len(extracted_facts)} facts.")

        except Exception as e:
            current_app.logger.error(f"Celery Task (Internal): General error during user fact extraction for {user_id}: {e}", exc_info=True)
            db.session.rollback()