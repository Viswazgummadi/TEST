# backend/app/utils/file_reader.py
import os
import shutil
import git
from flask import current_app
# CHANGED: from backend.app.models.models import DataSource to from ..models.models import DataSource
# This import style assumes 'app' is the root of your Flask application's package structure when running Flask locally.
from ..models.models import DataSource 
from .. import db # ADDED: Needs db to access db.session.get

def read_file_from_repo(data_source_id: str, file_path: str) -> str:
    """
    Clones a repository on-demand to a temporary location, reads the content
    of a specific file, and then deletes the temporary clone.
    """
    data_source = db.session.get(DataSource, data_source_id)
    if not data_source:
        return f"Error: Data source with ID {data_source_id} not found."

    repo_full_name = data_source.connection_details.get('repo_full_name')
    if not repo_full_name:
        return "Error: Could not determine the repository name from the data source."

    temp_clone_path = os.path.join(current_app.config['REPO_CLONE_PATH'], f"temp_{data_source_id}")
    
    try:
        # Fetch GitHub PAT for cloning
        # This part assumes GITHUB_PAT is in app.config or APIKey table
        github_pat = current_app.config.get('GITHUB_PAT')
        if not github_pat:
            # You might need a more robust way to get decrypted API keys if not from env
            # For now, if current_app.config.get('GITHUB_PAT') is not set, it won't work
            current_app.logger.warning("GitHub PAT not found in config for file_reader cloning.")
            return "Error: GitHub Personal Access Token is not configured for cloning."


        clone_url = f"https://{github_pat}@github.com/{repo_full_name}.git"

        if os.path.exists(temp_clone_path):
            shutil.rmtree(temp_clone_path)
        
        current_app.logger.info(f"File Reader: Cloning '{repo_full_name}' to '{temp_clone_path}'...")
        git.Repo.clone_from(clone_url, temp_clone_path, depth=1)
        current_app.logger.info(f"File Reader: Cloning successful.")

        full_file_path = os.path.join(temp_clone_path, file_path)

        if not os.path.exists(full_file_path):
            return f"Error: File '{file_path}' not found in the repository."

        with open(full_file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        return content

    except Exception as e:
        current_app.logger.error(f"File Reader: Error processing repo {data_source_id}: {e}", exc_info=True)
        return f"An error occurred while trying to read the file: {e}"
    finally:
        if os.path.exists(temp_clone_path):
            shutil.rmtree(temp_clone_path)
            current_app.logger.info(f"File Reader: Cleaned up temporary clone at {temp_clone_path}")