# backend/celery_worker.py

from dotenv import load_dotenv
from celery import Celery, signals # Import Celery here
import os 

# Load .env variables
load_dotenv()

# Import create_app factory and Config directly.
# NOTE: We DO NOT import celery_app from backend.app here, as it's defined here.
from backend.app import create_app
from backend.config import Config

# --- 1. Define and Fully Configure Celery App ---
# This is CRITICAL. celery_app is defined and configured immediately
# using the Config object. This ensures it has all its settings (including imports)
# BEFORE the Celery CLI's task discovery phase.
celery_app = Celery(
    Config.PROJECT_NAME, # Use PROJECT_NAME from Config
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND,
    include=Config.CELERY_IMPORTS, # 'include' is the correct Celery keyword for imports list
)

# Assign task routes (can be done here or directly in the Celery constructor via 'task_routes' argument)
celery_app.conf.task_routes = Config.CELERY_TASK_ROUTES

# --- 2. Flask App Context Management for Celery Tasks ---
# Global variable to hold the Flask application instance for the worker process.
flask_app_for_celery = None

@signals.worker_process_init.connect
def configure_flask_app_for_worker(sender=None, **kwargs):
    """
    Called once when a Celery worker process starts.
    Creates the Flask app instance for this worker.
    """
    global flask_app_for_celery
    if flask_app_for_celery is None:
        flask_app_for_celery = create_app(Config)
        # Note: The `celery_app` above is already fully configured at this point.
        # We are just creating the Flask app instance so tasks can use `current_app`, `db`, etc.

@signals.task_prerun.connect
def push_flask_app_context_for_task(sender=None, task=None, **kwargs):
    """
    Called before a task is executed. Pushes the Flask application context.
    """
    if flask_app_for_celery:
        task.flask_app_context = flask_app_for_celery.app_context()
        task.flask_app_context.push()
    else:
        sender.app.logger.error("Celery worker_process_init failed to create Flask app instance before task_prerun.")

@signals.task_postrun.connect
def pop_flask_app_context_after_task(sender=None, task=None, **kwargs):
    """
    Called after a task is executed (successfully or with failure).
    Pops the Flask application context.
    """
    if hasattr(task, 'flask_app_context') and task.flask_app_context is not None:
        task.flask_app_context.pop()
        del task.flask_app_context # Clean up the reference

# --- 3. Define Celery's Task Class (for Flask context) ---
# All tasks will inherit from this ContextTask.
# This ensures that when a task (like one from memory_tasks) is run,
# it implicitly runs within a Flask app context established by the signals above.
class ContextTask(celery_app.Task):
    pass

celery_app.Task = ContextTask

# The `celery_app` defined here is the one Celery will use directly.