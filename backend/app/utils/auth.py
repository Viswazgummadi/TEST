# backend/app/utils/auth.py
import datetime
import jwt
from functools import wraps
from flask import request, jsonify, current_app, g
from cryptography.fernet import InvalidToken as FernetInvalidToken

# CHANGED: from backend.app.models.models import AdminUser to from ..models.models import AdminUser
from ..models.models import AdminUser
# CHANGED: from backend.app import db to from .. import db
from .. import db # Ensure db is imported correctly

def encrypt_value(value: str) -> str | None:
    fernet = current_app.fernet_cipher 
    if not fernet or not value: 
        current_app.logger.warning("Encryption skipped: Fernet not available or no value.")
        return None
    try: 
        return fernet.encrypt(value.encode()).decode()
    except Exception as e: 
        current_app.logger.error(f"Encryption failed: {e}")
        return None

def decrypt_value(encrypted_value: str) -> str | None:
    fernet = current_app.fernet_cipher 
    if not fernet or not encrypted_value: 
        current_app.logger.warning("Decryption skipped: Fernet not available or no value.")
        return None
    try: 
        return fernet.decrypt(encrypted_value.encode()).decode()
    except FernetInvalidToken: 
        current_app.logger.error("Decryption failed: Invalid token for Fernet (likely wrong key or corrupted data).")
        return None
    except Exception as e: 
        current_app.logger.error(f"Decryption failed: {e}")
        return None

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            try:
                # This needs to be token = auth_header.split(" ")[1] if it was just "Bearer abc"
                # If it was token = auth_header.split(" ") and you were expecting token[1] then that was fine
                # Reverting to what was likely the original working form for a Bearer token
                token = auth_header.split(" ")[1] 
            except IndexError:
                current_app.logger.warning("Bearer token malformed.")
                return jsonify({'message': 'Bearer token malformed'}), 401
        
        if not token:
            current_app.logger.warning("Token is missing from request.")
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            jwt_secret = current_app.config['JWT_SECRET_KEY']
            jwt_algo = current_app.config['JWT_ALGORITHM']
            
            data = jwt.decode(token, jwt_secret, algorithms=[jwt_algo])
            admin_user = db.session.query(AdminUser).filter_by(username=data['sub']).first()
            if not admin_user:
                current_app.logger.warning(f"User '{data['sub']}' specified in token not found.")
                raise jwt.InvalidTokenError("User specified in token not found.")
            
            g.current_user = admin_user
            current_user_identity = admin_user.username 
            
        except jwt.ExpiredSignatureError:
            current_app.logger.info("Token has expired.")
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError as e:
            current_app.logger.warning(f"Token is invalid: {str(e)}")
            return jsonify({'message': f'Token is invalid. Details: {str(e)}'}), 401
        except Exception as e:
            current_app.logger.error(f"Token validation error: {e}", exc_info=True)
            return jsonify({'message': 'Error processing token.'}), 500
            
        return f(current_user_identity, *args, **kwargs)
    return decorated