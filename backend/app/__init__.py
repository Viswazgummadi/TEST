# backend/app/__init__.py

import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_migrate import Migrate
from cryptography.fernet import Fernet
from datetime import timedelta
# REMOVED: from celery import Celery, as celery_app is no longer defined here

# Initialize Flask extensions globally
db = SQLAlchemy()
bcrypt = Bcrypt()
migrate = Migrate()

# REMOVED: celery_app = Celery(__name__) - This is now defined *only* in celery_worker.py

def create_app(config_object=None):
    app = Flask(__name__, instance_relative_config=True)
    
    # Load configuration from object
    if config_object is None:
        # Default configuration for 'flask run' when no argument is explicitly passed.
        from backend.config import Config as DefaultConfig
        app.config.from_object(DefaultConfig)
    else:
        # Use the provided config_object (e.g., from celery_worker.py)
        app.config.from_object(config_object)

    # Safely ensure REPO_CLONE_PATH exists after config is loaded
    repo_clone_path = app.config.get('REPO_CLONE_PATH')
    if repo_clone_path and not os.path.exists(repo_clone_path):
        os.makedirs(repo_clone_path)

    # Configure Flask session
    app.config['SECRET_KEY'] = app.config.get('JWT_SECRET_KEY') or app.config.get('SECRET_KEY')
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=15)
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['SESSION_COOKIE_SECURE'] = True 
    
    # Configure CORS
    origins = app.config.get('CORS_ORIGINS', 'http://localhost:5173').split(',')
    CORS(app, supports_credentials=True, origins=origins)
    
    # Ensure instance path exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize extensions with the Flask app instance
    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    
    # Initialize Fernet cipher for API key encryption
    api_encryption_key_str = app.config.get('API_ENCRYPTION_KEY')
    if api_encryption_key_str:
        app.fernet_cipher = Fernet(api_encryption_key_str.encode('utf-8'))
    else:
        app.fernet_cipher = None
    
    # REMOVED: Celery app configuration from here.

    # Import and register blueprints
    from .routes.general_routes import general_bp
    from .routes.admin_routes import admin_bp
    from .routes.chat_routes import chat_bp
    from .routes.data_source_routes import data_source_bp
    from .routes.github_routes import github_bp
    from .routes.google_routes import google_bp
    
    app.register_blueprint(general_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(data_source_bp)
    app.register_blueprint(github_bp)
    app.register_blueprint(google_bp)

    app.logger.info("Flask app created and configured.")
    return app