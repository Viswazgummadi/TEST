# backend/config.py

from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    # --- Flask, DB, JWT, CORS Config ---
    SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-fallback-super-secret-key-for-flask')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///app_data.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key-please-change')
    JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
    JWT_EXP_DELTA_SECONDS = int(os.environ.get('JWT_EXP_DELTA_SECONDS', 3600))
    API_ENCRYPTION_KEY = os.environ.get('API_ENCRYPTION_KEY')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173')
    INITIAL_ADMIN_USERNAME = os.environ.get('INITIAL_ADMIN_USERNAME', 'admin')
    INITIAL_ADMIN_PASSWORD = os.environ.get('INITIAL_ADMIN_PASSWORD', '123')
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:5001/api/connect/google/callback')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    GITHUB_PAT = os.environ.get('GITHUB_PAT')
    REPO_CLONE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'repos_cloned')

    # --- Neo4j AuraDB Configuration ---
    NEO4J_URI = os.environ.get('NEO4J_URI')
    NEO4J_USERNAME = os.environ.get('NEO4J_USERNAME')
    NEO4J_PASSWORD = os.environ.get('NEO4J_PASSWORD')
    
    # --- Pinecone Configuration ---
    PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
    
    EMBEDDING_BATCH_SIZE = 100
    EMBEDDING_REQUEST_DELAY = 1.5
    ENABLE_AI_DOCSTRING_GENERATION = True

    # --- Project Name for Celery App ---
    PROJECT_NAME = 'reploit' 

    # --- Celery Configuration ---
    # These map directly to Celery's configuration.
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    
    # List of modules to import when the Celery worker starts.
    # These modules should contain your Celery tasks.
    CELERY_IMPORTS = (
        'backend.app.tasks.repo_ingestion_tasks',
        'backend.app.tasks.memory_tasks',
    )
    # Define task routes/queues
    CELERY_TASK_ROUTES = {
        'backend.app.tasks.repo_ingestion_tasks.*': {'queue': 'repo_ingestion'},
        'backend.app.tasks.memory_tasks.*': {'queue': 'memory_tasks'},
    }
    