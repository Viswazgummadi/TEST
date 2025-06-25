# backend/app/routes/chat_routes.py
from flask import Blueprint, request, jsonify, current_app, Response, stream_with_context # Added Response and stream_with_context
import google.generativeai as genai
import json # For formatting SSE data

# Import utilities and models
from ..utils.auth import decrypt_value
from ..models.models import db, APIKey, ConfiguredModel

chat_bp = Blueprint('chat_api_routes', __name__)

@chat_bp.route('/available-models', methods=['GET'])
def get_available_chat_models():
    # ... (your existing code for available-models - no changes needed here for streaming)
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


@chat_bp.route('/', methods=['POST','OPTIONS'])
def chat_handler():
    if request.method == 'OPTIONS':
        response = jsonify(success=True)
        # These headers are important for the actual streaming response too
        response.headers.add("Access-Control-Allow-Origin", "*") 
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
        return response, 200

    data = request.get_json()
    user_query = data.get('query')
    selected_model_id_from_frontend = data.get('model')

    if not user_query: return jsonify({"error": "Missing query"}), 400
    if not selected_model_id_from_frontend: return jsonify({"error": "Missing model selection"}), 400

    db_model_config = db.session.query(ConfiguredModel).filter_by(
        model_id_string=selected_model_id_from_frontend, 
        is_active=True
    ).first()

    if not db_model_config:
        return jsonify({"error": f"Model '{selected_model_id_from_frontend}' is not configured or not active."}), 400

    api_key_name_for_model = db_model_config.api_key_name_ref
    decrypted_key = None

    if api_key_name_for_model:
        if not current_app.fernet_cipher:
            # For streaming, we can't easily return JSON error mid-stream.
            # This pre-check is fine.
            return jsonify({"error": "API Key encryption is not configured on server."}), 503
        
        api_key_entry = db.session.query(APIKey).filter_by(service_name=api_key_name_for_model).first()
        if not api_key_entry:
            return jsonify({"error": f"Required API key '{api_key_name_for_model}' for model '{db_model_config.display_name}' is not found."}), 503
        
        decrypted_key = decrypt_value(api_key_entry.key_value_encrypted)
        if not decrypted_key:
            current_app.logger.error(f"Failed to decrypt API key '{api_key_name_for_model}'.")
            return jsonify({"error": f"Could not decrypt API key '{api_key_name_for_model}'."}), 500
    
    # --- Actual Model Interaction & Streaming ---
    try:
        if db_model_config.provider.lower() == "google":
            if api_key_name_for_model and not decrypted_key:
                 return jsonify({"error": "Google AI API key is required but was not processed correctly."}), 500
            
            if api_key_name_for_model:
                genai.configure(api_key=decrypted_key)
            
            model_instance = genai.GenerativeModel(db_model_config.model_id_string)
            
            # --- THIS IS THE KEY CHANGE FOR STREAMING ---
            gemini_stream = model_instance.generate_content(user_query, stream=True)

            def generate_stream_chunks():
                try:
                    for chunk in gemini_stream:
                        # Ensure chunk has text. Sometimes, finish_reason or other metadata comes through.
                        # Adjust based on the actual structure of chunks from Gemini.
                        # Common practice is to check chunk.text or chunk.parts[0].text
                        if chunk.text: # Check if text attribute exists and is not None
                            # SSE format: data: <json_string>\n\n
                            # We send a JSON object with a "chunk" key.
                            data_payload = json.dumps({"chunk": chunk.text})
                            yield f"data: {data_payload}\n\n"
                        # You might also want to send a special "end" event or handle errors.
                        # For example, if chunk.prompt_feedback indicates a block:
                        if chunk.prompt_feedback and chunk.prompt_feedback.block_reason:
                            error_payload = json.dumps({"error": f"Content blocked: {chunk.prompt_feedback.block_reason_message}"})
                            yield f"data: {error_payload}\n\n" # Send as data or a specific event type
                            current_app.logger.warning(f"Gemini content blocked: {chunk.prompt_feedback.block_reason_message}")
                            return # Stop streaming if content is blocked

                    # Optionally, send a final "done" message or metadata
                    # done_payload = json.dumps({"status": "done", "traceUrl": f"mock/trace/for/{db_model_config.model_id_string}"})
                    # yield f"data: {done_payload}\n\n"

                except Exception as e:
                    current_app.logger.error(f"Error during Gemini stream generation: {e}", exc_info=True)
                    # Yield an error message to the client if possible during streaming
                    error_payload = json.dumps({"error": f"Stream generation error: {str(e)}"})
                    yield f"data: {error_payload}\n\n"

            # Return a streaming response
            # The Content-Type text/event-stream is crucial for SSE.
            response = Response(stream_with_context(generate_stream_chunks()), mimetype='text/event-stream')
            # Add CORS headers to the streaming response as well
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization") # Ensure Authorization is listed if you use it for streaming too
            response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS") # Though for SSE it's technically a GET-like behavior after initial POST
            response.headers.add("Cache-Control", "no-cache") # Important for SSE
            response.headers.add("X-Accel-Buffering", "no") # Often needed for Nginx or other reverse proxies
            return response

        # Add elif for other providers (OpenAI, Ollama, etc.) here for streaming
        # elif db_model_config.provider.lower() == "openai":
        #     # OpenAI streaming would be similar but use their SDK's streaming mechanism
        #     return Response(stream_with_context(...), mimetype='text/event-stream')
        else:
            current_app.logger.error(f"Unsupported provider '{db_model_config.provider}'.")
            # For non-streaming, but ideally all chat models should support streaming
            return jsonify({"error": f"Provider '{db_model_config.provider}' is not yet supported for streaming."}), 501

    except genai.types.generation_types.BlockedPromptException as bpe:
        current_app.logger.error(f"Gemini request blocked for model {db_model_config.model_id_string}: {bpe}", exc_info=True)
        return jsonify({"error": f"Your request was blocked by the content safety filter: {bpe}"}), 400 # Or a more specific error code
    except Exception as e:
        current_app.logger.error(f"Error calling AI service {db_model_config.model_id_string}: {e}", exc_info=True)
        # It's hard to return JSON error if streaming has started. This catches pre-stream errors.
        return jsonify({"error": f"An error occurred with the AI service: {str(e)}"}), 502