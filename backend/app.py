# backend/app.py
import os
import datetime
import jwt
from functools import wraps
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from cryptography.fernet import Fernet, InvalidToken as FernetInvalidToken # For encryption
from dotenv import load_dotenv
import urllib.parse # For URL encoding/decoding service names

load_dotenv()

app = Flask(__name__)

# --- Configurations ---
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key-please-change')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///./default_reploit.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- Extensions Initialization ---
CORS(app, resources={r"/api/*": {"origins": os.environ.get('CORS_ORIGINS', 'http://localhost:5173')}})
bcrypt = Bcrypt(app)

from models import db, AdminUser, APIKey
db.init_app(app)

# --- JWT Configuration ---
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key-please-change')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXP_DELTA_SECONDS = int(os.environ.get('JWT_EXP_DELTA_SECONDS', 3600))

# --- API Key Encryption Setup ---
API_ENCRYPTION_KEY_STR = os.environ.get('API_ENCRYPTION_KEY')
if not API_ENCRYPTION_KEY_STR:
    app.logger.warning("API_ENCRYPTION_KEY is not set in .env. API key storage will not be functional.")
    fernet_cipher = None
else:
    try:
        # The key must be URL-safe base64 encoded
        fernet_cipher = Fernet(API_ENCRYPTION_KEY_STR.encode())
    except Exception as e:
        app.logger.error(f"Failed to initialize Fernet cipher with API_ENCRYPTION_KEY: {e}. API key storage will not be functional.")
        fernet_cipher = None

def encrypt_value(value: str) -> str | None:
    if not fernet_cipher or not value:
        return None
    try:
        return fernet_cipher.encrypt(value.encode()).decode()
    except Exception as e:
        app.logger.error(f"Encryption failed: {e}")
        return None

def decrypt_value(encrypted_value: str) -> str | None:
    if not fernet_cipher or not encrypted_value:
        return None
    try:
        return fernet_cipher.decrypt(encrypted_value.encode()).decode()
    except FernetInvalidToken: # More specific exception for decryption failure
        app.logger.error("Decryption failed: Invalid token (likely wrong key or corrupted data)")
        return None
    except Exception as e:
        app.logger.error(f"Decryption failed: {e}")
        return None

# --- Token Required Decorator (No changes from before) ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                try: token = auth_header.split(" ")[1]
                except IndexError: return jsonify({'message': 'Bearer token malformed'}), 401
            else: return jsonify({'message': 'Authorization header must be Bearer token'}), 401
        if not token: return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            admin_user = AdminUser.query.filter_by(username=data['sub']).first()
            if not admin_user: raise jwt.InvalidTokenError("User specified in token not found.")
            current_user_identity = admin_user.username 
        except jwt.ExpiredSignatureError: return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError as e: return jsonify({'message': f'Token is invalid. Details: {str(e)}'}), 401
        except Exception as e:
            app.logger.error(f"Unexpected error during token validation: {str(e)}")
            return jsonify({'message': 'Error processing token.'}), 500
        return f(current_user_identity, *args, **kwargs)
    return decorated

# --- Routes ---
@app.route('/api/hello')
def hello():
    return jsonify(message="Hello from Simple Flask Backend with DB!")

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    # ... (admin_login function remains unchanged from previous full code)
    data = request.get_json()
    if not data: return jsonify({"error": "Missing JSON data"}), 400
    username_attempt = data.get('username')
    password_attempt = data.get('password')
    if not username_attempt or not password_attempt: return jsonify({"error": "Missing username or password"}), 400
    admin_user = AdminUser.query.filter_by(username=username_attempt).first()
    if admin_user and bcrypt.check_password_hash(admin_user.password_hash, password_attempt):
        token_payload = {
            'sub': admin_user.username,
            'iat': datetime.datetime.utcnow(),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=JWT_EXP_DELTA_SECONDS)
        }
        try:
            access_token = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
            return jsonify({"message": "Admin login successful", "token": access_token}), 200
        except Exception as e:
            app.logger.error(f"Error encoding JWT: {str(e)}")
            return jsonify({"error": "Could not generate token"}), 500
    else: return jsonify({"error": "Invalid admin credentials"}), 401


@app.route('/api/admin/profile', methods=['GET'])
@token_required
def admin_profile(current_admin_username):
    # ... (admin_profile function remains unchanged from previous full code)
    admin_user = AdminUser.query.filter_by(username=current_admin_username).first()
    if not admin_user: return jsonify({"error": "Admin user not found, though token was valid."}), 404
    return jsonify({
        "message": f"Welcome Admin: {admin_user.username}!",
        "profile_data": {
            "id": admin_user.id, "username": admin_user.username,
            "joined_on": admin_user.created_at.isoformat() if admin_user.created_at else None
        }
    }), 200

# --- API Key Management Endpoints ---
@app.route('/api/admin/settings/apikeys', methods=['GET'])
@token_required
def get_api_keys_status(current_admin_username):
    if not fernet_cipher:
        return jsonify({"error": "API Key encryption is not configured on the server."}), 503 # Service Unavailable
    try:
        keys = APIKey.query.all()
        # For security, only return service_name and whether it's set, not the encrypted value
        keys_status = [{"service_name": key.service_name, "is_set": True, "updated_at": key.updated_at.isoformat()} for key in keys]
        return jsonify(keys_status), 200
    except Exception as e:
        app.logger.error(f"Error fetching API keys status: {e}")
        return jsonify({"error": "Could not retrieve API key statuses."}), 500

@app.route('/api/admin/settings/apikeys', methods=['POST'])
@token_required
def add_or_update_api_key(current_admin_username):
    if not fernet_cipher:
        return jsonify({"error": "API Key encryption is not configured on the server."}), 503

    data = request.get_json()
    service_name = data.get('service_name')
    key_value = data.get('key_value')

    if not service_name or not key_value:
        return jsonify({"error": "Missing service_name or key_value"}), 400

    encrypted_value = encrypt_value(key_value)
    if not encrypted_value:
        return jsonify({"error": "Failed to encrypt API key."}), 500

    try:
        api_key_entry = APIKey.query.filter_by(service_name=service_name).first()
        if api_key_entry:
            api_key_entry.key_value_encrypted = encrypted_value
            api_key_entry.updated_at = datetime.datetime.utcnow()
            message = f"API key for '{service_name}' updated successfully."
        else:
            api_key_entry = APIKey(service_name=service_name, key_value_encrypted=encrypted_value)
            db.session.add(api_key_entry)
            message = f"API key for '{service_name}' added successfully."
        
        db.session.commit()
        return jsonify({"message": message}), 200 if not api_key_entry else 201 # 201 Created for new
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Database error processing API key for {service_name}: {e}")
        return jsonify({"error": f"Could not save API key for {service_name}."}), 500

@app.route('/api/admin/settings/apikeys/<path:service_name_encoded>', methods=['DELETE'])
@token_required
def delete_api_key(current_admin_username, service_name_encoded):
    if not fernet_cipher: # Should not happen if other routes are working, but good check
        return jsonify({"error": "API Key encryption is not configured on the server."}), 503
        
    try:
        # Service names might contain slashes or other special characters, so URL decode them
        service_name = urllib.parse.unquote_plus(service_name_encoded)
    except Exception as e:
        return jsonify({"error": f"Invalid service name encoding: {str(e)}"}), 400

    try:
        api_key_entry = APIKey.query.filter_by(service_name=service_name).first()
        if not api_key_entry:
            return jsonify({"error": f"API key for '{service_name}' not found."}), 404
        
        db.session.delete(api_key_entry)
        db.session.commit()
        return jsonify({"message": f"API key for '{service_name}' deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Database error deleting API key for {service_name}: {e}")
        return jsonify({"error": f"Could not delete API key for {service_name}."}), 500


# --- Flask CLI Commands (create-admin remains unchanged from previous full code) ---
@app.cli.command("create-admin")
def create_admin_command():
    # ... (create_admin_command remains unchanged, ensure debug print is removed if desired)
    # print(f"DEBUG: create-admin command using DATABASE_URL: {app.config['SQLALCHEMY_DATABASE_URI']}")
    default_username = os.environ.get('INITIAL_ADMIN_USERNAME', 'admin')
    default_password = os.environ.get('INITIAL_ADMIN_PASSWORD', 'changethispassword')
    if not default_username or not default_password:
        print("Error: INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD must be set in .env"); return
    admin_user = AdminUser.query.filter_by(username=default_username).first()
    hashed_password = bcrypt.generate_password_hash(default_password).decode('utf-8')
    if admin_user:
        admin_user.password_hash = hashed_password
        action_message = f"Admin user '{default_username}' already exists. Password has been updated."
    else:
        admin_user = AdminUser(username=default_username, password_hash=hashed_password)
        db.session.add(admin_user); action_message = f"Admin user '{default_username}' created successfully."
    try:
        db.session.commit(); print(action_message)
        if "created" in action_message: print(f"IMPORTANT: Initial password for '{default_username}' is '{default_password}'.")
    except Exception as e: db.session.rollback(); print(f"Error processing admin user: {str(e)}")


if __name__ == '__main__':
    app.run(debug=True, port=5001)