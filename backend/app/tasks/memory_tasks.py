# backend/app/tasks/memory_tasks.py

from datetime import datetime, timezone
from flask import current_app
import logging

# CORRECTED: Import db from backend.app, and celery_app from backend.celery_worker
from backend.app import db # db is from backend.app (global instance)
from backend.celery_worker import celery_app # Import celery_app from where it's defined and configured

from backend.app.models.models import RepoConversationSummary, UserFact
from backend.app.utils.llm_utils import generate_repo_summary, extract_user_facts

logger = logging.getLogger(__name__)

# Register tasks with the celery_app imported from celery_worker.py.
# The ContextTask defined in backend.celery_worker.py ensures Flask context.

@celery_app.task
def generate_repo_summary_task(user_id: str, data_source_id: str, last_chat_timestamp_str: str):
    """
    Celery task to generate or update a conversation summary for a repository.
    The Flask app context is automatically pushed/popped by the ContextTask and signals.
    """
    logger.info(f"Celery Task: Starting repo summary for user {user_id}, data source {data_source_id}")
    try:
        # Call the utility function that contains the main logic
        summary = generate_repo_summary(user_id, data_source_id, new_messages_only=True)
        logger.info(f"Celery Task: Repo summary completed for user {user_id}, data source {data_source_id}")
        return summary
    except Exception as e:
        logger.error(f"Celery Task: Error in repo summary for user {user_id}, data source {data_source_id}: {e}", exc_info=True)


@celery_app.task
def extract_user_facts_task(user_id: str):
    """
    Celery task to extract and store general facts about the user.
    The Flask app context is automatically pushed/popped by the ContextTask and signals.
    """
    logger.info(f"Celery Task: Starting user fact extraction for user {user_id}")
    try:
        # Call the utility function that contains the main logic
        extract_user_facts(user_id, new_messages_only=False) # Always extract from full history
        logger.info(f"Celery Task: User fact extraction completed for user {user_id}")
    except Exception as e:
        logger.error(f"Celery Task: Error in user fact extraction for user {user_id}: {e}", exc_info=True)