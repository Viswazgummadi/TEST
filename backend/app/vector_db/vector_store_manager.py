# backend/app/vector_db/vector_store_manager.py
import time
import json
from pinecone import Pinecone
from flask import current_app
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
# CHANGED: from app.models.models import ... to from ..models.models import ...
# This import style uses relative pathing, which is generally more robust within a package.
from ..models.models import db, ConfiguredModel, APIKey, AdminUser, RepoConversationSummary, UserFact, ChatHistory

class VectorStoreManager:
    """Manages all interactions with the Pinecone Vector Database and Gemini Embedding API."""
    def __init__(self, index_name='reploit-index'):
        pinecone_api_key = current_app.config.get('PINECONE_API_KEY')
        gemini_api_key = current_app.config.get('GEMINI_API_KEY')

        if not pinecone_api_key:
            raise ValueError("Pinecone API Key is not configured.")
        if not gemini_api_key:
            raise ValueError("Gemini API Key is not configured.")

        self.pinecone = Pinecone(api_key=pinecone_api_key)
        self.index_name = index_name
        
        self.embedding_model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=gemini_api_key)
        self.chat_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, google_api_key=gemini_api_key)

    def get_index(self):
        """Connects to the specified Pinecone index."""
        if self.index_name not in self.pinecone.list_indexes().names():
            raise ValueError(f"Pinecone index '{self.index_name}' does not exist. Please create it in the Pinecone dashboard.")
        return self.pinecone.Index(self.index_name)

    def query_vectors(self, query: str, data_source_id: str, top_k: int = 5) -> str:
        """
        Takes a natural language query, embeds it, and queries Pinecone to find the
        top_k most semantically similar text chunks (function descriptions).
        """
        current_app.logger.info(f"VDB Tool: Received query -> '{query}' for data source '{data_source_id}'")
        try:
            index = self.get_index()
            
            query_vector = self.embedding_model.embed_query(query)

            query_results = index.query(
                namespace=data_source_id,
                vector=query_vector,
                top_k=top_k,
                include_metadata=True
            )

            if not query_results['matches']:
                return "No relevant functions found in the vector database."

            context_str = "Found relevant functions:\n\n"
            for match in query_results['matches']:
                metadata = match['metadata']
                context_str += (
                    f"--- Function: {metadata.get('function_name', 'N/A')} ---\n"
                    f"File: {metadata.get('file_path', 'N/A')}\n"
                    f"Similarity Score: {match['score']:.4f}\n"
                )

            current_app.logger.info(f"VDB Tool: Found {len(query_results['matches'])} results.")
            return context_str

        except Exception as e:
            current_app.logger.error(f"Error querying vector database: {e}", exc_info=True)
            return "There was an error while querying the vector database."

    def generate_docstrings_in_batch(self, functions_to_document: list[dict]) -> list[str]:
        """
        Uses a Gemini chat model to generate docstrings for a batch of functions that lack them.
        """
        if not functions_to_document:
            return []

        prompt = """
You are an expert Python programmer tasked with writing concise, accurate, one-line docstrings.
Analyze the following Python functions and generate a single-line docstring for each, explaining its core purpose based *only* on the provided code.
Your response MUST be a valid JSON array of strings, where each string is a docstring for the corresponding function in the input array.
The number of strings in your output array MUST exactly match the number of functions in the input array.
Do not add any explanation, preamble, or markdown formatting like ```json to your response. Just the raw JSON array.

Example Input:
[
  { "name": "add", "code": "def add(a, b):\\n    return a + b" }
]

Example Output:
[
  "Adds two numbers, 'a' and 'b', and returns the sum."
]

Now, generate docstrings for this list of functions:
"""
        
        prompt_payload = [{"name": func['name'], "code": func['source_code']} for func in functions_to_document]
        full_prompt = prompt + json.dumps(prompt_payload, indent=2)

        try:
            response = self.chat_model.invoke(full_prompt)
            
            cleaned_response = response.content.strip().replace("```json", "").replace("```", "").strip()
            generated_docstrings = json.loads(cleaned_response)

            if isinstance(generated_docstrings, list) and len(generated_docstrings) == len(functions_to_document):
                current_app.logger.info(f"Successfully generated {len(generated_docstrings)} docstrings from AI.")
                return generated_docstrings
            else:
                current_app.logger.error("AI response for docstrings was not a valid list or had an incorrect length.")
                return ["# AI-generated docstring failed: Invalid format." for _ in functions_to_document]

        except Exception as e:
            current_app.logger.error(f"Error calling Gemini for docstring generation: {e}")
            return ["# AI-generated docstring failed due to an API error." for _ in functions_to_document]

    def generate_and_store_embeddings(self, text_chunks: list[str], metadatas: list[dict], data_source_id: str):
        """
        Generates embeddings for text chunks using Gemini and stores them in Pinecone.
        This method implements batching and throttling to handle API rate limits.
        """
        index = self.get_index()
        batch_size = current_app.config.get('EMBEDDING_BATCH_SIZE', 100)
        delay = current_app.config.get('EMBEDDING_REQUEST_DELAY', 1.5)

        current_app.logger.info(f"Starting embedding generation for {len(text_chunks)} chunks...")

        for i in range(0, len(text_chunks), batch_size):
            batch_texts = text_chunks[i : i + batch_size]
            batch_metadatas = metadatas[i : i + batch_size]

            current_app.logger.info(f"Processing embedding batch {i // batch_size + 1} with {len(batch_texts)} items...")

            try:
                embeddings = self.embedding_model.embed_documents(batch_texts)
            except Exception as e:
                current_app.logger.error(f"Error calling Gemini Embedding API for batch {i // batch_size + 1}: {e}")
                continue

            vectors_to_upsert = []
            for j, embedding in enumerate(embeddings):
                metadata = batch_metadatas[j]
                vector_id = f"{data_source_id}:{metadata['file_path']}:{metadata['function_name']}"
                vectors_to_upsert.append({
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata
                })

            if vectors_to_upsert:
                index.upsert(vectors=vectors_to_upsert, namespace=data_source_id)
            
            current_app.logger.info(f"Batch complete. Waiting for {delay} seconds...")
            time.sleep(delay)

        current_app.logger.info("✅ Finished generating and storing all embeddings.")

    def clear_data_source_data(self, data_source_id: str):
        """Deletes all vectors associated with a specific data source from the index using namespaces."""
        try:
            index = self.get_index()
            index.delete(delete_all=True, namespace=data_source_id)
            current_app.logger.info(f"VectorDB: Cleared all vectors in namespace '{data_source_id}'.")
        except Exception as e:
            current_app.logger.error(f"Failed to clear vector data for data source {data_source_id}: {e}")