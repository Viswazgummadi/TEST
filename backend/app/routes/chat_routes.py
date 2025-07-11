# backend/app/routes/chat_routes.py
from flask import Blueprint, request, jsonify, current_app, Response, stream_with_context, g
import json
from flask_cors import CORS
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
import os
import time

from ..utils.auth import decrypt_value, token_required
from ..models.models import APIKey, ConfiguredModel, DataSource, ChatHistory, AdminUser, RepoConversationSummary, UserFact
# ADDED: Import celery_app and the new tasks
from backend.celery_worker import celery_app # Import from celery_worker directly
from ..tasks.memory_tasks import generate_repo_summary_task, extract_user_facts_task
from ..ai_core.graph import agent_graph # THIS IMPORT IS THE KEY
from backend.app import db 

chat_bp = Blueprint('chat_api_routes', __name__, url_prefix='/api/chat')
CORS(chat_bp, supports_credentials=True)

@chat_bp.route('/available-models/', methods=['GET'])
def get_available_chat_models():
    available_models_from_db = []
    try:
        configured_db_models = db.session.query(ConfiguredModel).filter_by(is_active=True).all()
        
        for model_config in configured_db_models:
            is_truly_available = False
            api_key_name = model_config.api_key_name_ref

            if not api_key_name: 
                is_truly_available = True
            elif current_app.fernet_cipher:
                api_key_entry = db.session.query(APIKey).filter_by(service_name=api_key_name).first()
                if api_key_entry and decrypt_value(api_key_entry.key_value_encrypted):
                    is_truly_available = True
            
            if is_truly_available:
                available_models_from_db.append({
                    "id": model_config.model_id_string, 
                    "name": model_config.display_name,
                    "provider": model_config.provider,
                    "notes": model_config.notes or ""
                })
        
        if not current_app.fernet_cipher and any(mc.api_key_name_ref for mc in configured_db_models if mc.is_active):
            current_app.logger.warning("Fernet cipher not available, so API key-based models cannot be fully verified for availability.")

        return jsonify(available_models_from_db), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching available models from DB: {e}", exc_info=True)
        return jsonify({"error": "Could not retrieve available models", "details": str(e)}), 500

# NEW ROUTE: Fetch chat history for a session
@chat_bp.route('/history/<session_id>/', methods=['GET'])
@token_required
def get_chat_history(current_user_identity, session_id):
    data_source_id = request.args.get('repo_id')

    if not data_source_id:
        return jsonify({"error": "Missing repo_id query parameter."}), 400

    user = db.session.query(AdminUser).filter_by(username=current_user_identity).first()
    if not user:
        current_app.logger.error(f"Authenticated user '{current_user_identity}' not found.")
        return jsonify({"error": "User not found."}), 404

    try:
        history_messages = db.session.query(ChatHistory).filter_by(
            session_id=session_id,
            user_id=user.id,
            data_source_id=data_source_id
        ).order_by(ChatHistory.timestamp.asc()).all()
        
        return jsonify([msg.to_dict() for msg in history_messages]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching chat history for session {session_id}: {e}", exc_info=True)
        return jsonify({"error": "Could not retrieve chat history", "details": str(e)}), 500


# MODIFIED ROUTE: Handle chat submission and save history, pass to LangGraph agent
@chat_bp.route('/', methods=['POST'])
@token_required
def chat_handler(current_user_identity):
    data = request.get_json()
    user_query = data.get('query')
    selected_model_id_from_frontend = data.get('model')
    data_source_id = data.get('data_source_id')
    session_id = data.get('session_id')

    if not user_query: return jsonify({"error": "Missing query"}), 400
    if not selected_model_id_from_frontend: return jsonify({"error": "Missing model selection"}), 400
    if not session_id: return jsonify({"error": "Missing session_id"}), 400
    if not data_source_id: return jsonify({"error": "Missing data_source_id"}), 400

    user = db.session.query(AdminUser).filter_by(username=current_user_identity).first()
    if not user:
        current_app.logger.error(f"Authenticated user '{current_user_identity}' not found.")
        return jsonify({"error": "Authentication error: User not found."}), 401

    selected_data_source = db.session.get(DataSource, data_source_id)
    if selected_data_source:
        current_app.logger.info(f"Chat initiated for data source: {selected_data_source.name} (ID: {data_source_id}) by user {user.username}")
    else:
        current_app.logger.warning(f"Data source with ID {data_source_id} not found for chat request by user {user.username}.")
        return jsonify({"error": f"Data source with ID {data_source_id} not found."}), 404

    # --- SAVE USER MESSAGE TO HISTORY (Layer 1) ---
    new_user_message_entry = ChatHistory(
        session_id=session_id,
        user_id=user.id,
        data_source_id=data_source_id,
        message_content=user_query,
        sender='user'
    )
    db.session.add(new_user_message_entry)
    db.session.commit()

    # --- RETRIEVE ALL MEMORY LAYERS ---
    
    # Layer 1: Short-Term (In-Session) Conversation History
    all_chat_messages = db.session.query(ChatHistory).filter_by(
        session_id=session_id,
        user_id=user.id,
        data_source_id=data_source_id
    ).order_by(ChatHistory.timestamp.asc()).all()

    langchain_messages = []
    for msg in all_chat_messages:
        if msg.sender == 'user':
            langchain_messages.append(HumanMessage(content=msg.message_content))
        elif msg.sender == 'llm':
            langchain_messages.append(AIMessage(content=msg.message_content))
    
    current_app.logger.info(f"Retrieved {len(langchain_messages)} messages for session {session_id}.")

    # Layer 2: Mid-Term (Repo-Specific) Summarized Context
    repo_summary_record = db.session.query(RepoConversationSummary).filter_by(
        user_id=user.id,
        data_source_id=data_source_id
    ).first()
    repo_summary_text = repo_summary_record.summary_text if repo_summary_record else "No previous conversation summary for this repository."
    current_app.logger.info(f"Retrieved Repo Summary (length: {len(repo_summary_text)}).")

    # Layer 3: Long-Term (User-Specific) General Knowledge
    user_facts = db.session.query(UserFact).filter_by(user_id=user.id).all()
    user_facts_text = "User General Facts:\n"
    if user_facts:
        for fact in user_facts:
            user_facts_text += f"- {fact.fact_key}: {fact.fact_value}\n"
    else:
        user_facts_text += "No general facts known about the user yet.\n"
    current_app.logger.info(f"Retrieved {len(user_facts)} User Facts.")

    # --- Construct the combined prompt for the agent ---
    combined_messages_for_agent = []

    combined_messages_for_agent.append(SystemMessage(content=f"You are Reploit, an AI assistant. {user_facts_text}"))
    combined_messages_for_agent.append(SystemMessage(content=f"This is a summary of the previous conversation about the '{selected_data_source.name}' repository: {repo_summary_text}"))
    combined_messages_for_agent.extend(langchain_messages)

    # --- Retrieve API Key for the model selected from frontend ---
    llm_api_key = None
    db_model_config = db.session.query(ConfiguredModel).filter_by(
        model_id_string=selected_model_id_from_frontend, 
        is_active=True
    ).first()

    if not db_model_config:
        return jsonify({"error": f"Model '{selected_model_id_from_frontend}' is not configured or not active."}), 400

    api_key_name_for_model = db_model_config.api_key_name_ref
    if api_key_name_for_model:
        if not current_app.fernet_cipher:
            return jsonify({"error": "API Key encryption is not configured on server."}), 503
        
        api_key_entry = db.session.query(APIKey).filter_by(service_name=api_key_name_for_model).first()
        if not api_key_entry:
            current_app.logger.error(f"Required API key '{api_key_name_for_model}' for model '{db_model_config.display_name}' is not found.")
            return jsonify({"error": f"Required API key '{api_key_name_for_model}' for model '{db_model_config.display_name}' is not found."}), 503
        
        llm_api_key = decrypt_value(api_key_entry.key_value_encrypted)
        if not llm_api_key:
            current_app.logger.error(f"Failed to decrypt API key '{api_key_name_for_model}'.")
            return jsonify({"error": f"Could not decrypt API key '{api_key_name_for_model}'."}), 500

    # --- Prepare input for the LangGraph agent ---
    agent_input_state = {
    "original_query": user_query,
    "chat_history": combined_messages_for_agent, # Pass the full history
    "final_answer": [], # Initialize as an empty list
    "repo_id": data_source_id,
    "session_id": session_id,
    "api_key": llm_api_key,
    "model_id": selected_model_id_from_frontend
    }
# --- ADD THIS FINAL, CORRECT BLOCK ---
    try:
        current_app.logger.info("Starting agent graph execution...")
        full_ai_response_content = ""
        final_state = agent_graph.invoke(agent_input_state, {"recursion_limit": 15})
        # --- ALSO ADD THESE LINES ---
        if final_state and "final_answer" in final_state and final_state["final_answer"]:
            last_message = final_state["final_answer"][-1]
            if isinstance(last_message, AIMessage):
                full_ai_response_content = last_message.content
                current_app.logger.info(f"SUCCESS: Final answer retrieved from completed graph.")
        # This new loop inspects each state update as it happens.
        # for state_chunk in agent_graph.stream(agent_input_state, {"recursion_limit": 15}):
        #     # As soon as we see the 'final_answer' key appear, we grab it.
        #     # This is robust because we capture the answer the moment it's created.
        #     if "final_answer" in state_chunk and state_chunk["final_answer"]:
        #         last_message = state_chunk["final_answer"][-1]
        #         if isinstance(last_message, AIMessage):
        #             full_ai_response_content = last_message.content
        #             current_app.logger.info(f"SUCCESS: Final answer captured from graph stream.")
        
        # If the loop finishes and we never found a final answer, use a fallback message.
        if not full_ai_response_content:
            current_app.logger.warning("Graph execution finished, but no 'final_answer' was ever produced.")
            full_ai_response_content = "I was unable to produce a final answer based on the information I found."
        
        # The rest of the function for streaming the response and saving it is correct.
        ai_response_chunks = []
        def generate_stream_chunks():
            nonlocal ai_response_chunks
            try:
                ai_response_chunks = [full_ai_response_content]

                # Send the entire response as one single data chunk.
                if full_ai_response_content:
                    # The key is still 'chunk', but the value is the whole answer.
                    data_payload = json.dumps({"chunk": full_ai_response_content})
                    yield f"data: {data_payload}\n\n".encode('utf-8')

                # We still send the 'done' status so the frontend knows to stop listening.
                yield f"data: {json.dumps({'status': 'done'})}\n\n".encode('utf-8')
            except Exception as e:
                current_app.logger.error(f"Error during streaming simulation: {e}", exc_info=True)
                error_payload = json.dumps({"error": f"Stream generation error: {str(e)}"})
                yield f"data: {error_payload}\n\n".encode('utf-8')
                ai_response_chunks = [f"Error: {str(e)}"]
            finally:
                if ai_response_chunks:
                    final_save_content = "".join(ai_response_chunks)
                    new_ai_message_entry = ChatHistory(
                        session_id=session_id, user_id=user.id, data_source_id=data_source_id,
                        message_content=final_save_content, sender='llm'
                    )
                    db.session.add(new_ai_message_entry)
                    db.session.commit()
                    current_app.logger.info(f"AI response saved for session {session_id}.")
                    
                    celery_app.send_task(
                        'backend.app.tasks.memory_tasks.generate_repo_summary_task',
                        args=[user.id, data_source_id],
                        kwargs={'last_chat_timestamp_str': new_ai_message_entry.timestamp.isoformat()},
                        countdown=5
                    )
                    celery_app.send_task(
                        'backend.app.tasks.memory_tasks.extract_user_facts_task',
                        args=[user.id],
                        countdown=10
                    )

        response = Response(stream_with_context(generate_stream_chunks()), mimetype='text/event-stream')
        response.headers.add("Cache-Control", "no-cache")
        response.headers.add("X-Accel-Buffering", "no")
        response.direct_passthrough = True
        return response

    except Exception as e:
        current_app.logger.error(f"A critical error occurred with the AI agent: {e}", exc_info=True)
        return jsonify({"error": f"An error occurred with the AI agent: {str(e)}"}), 502