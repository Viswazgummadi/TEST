# backend/app/tasks/repo_ingestion_tasks.py
import os
import shutil
import git
from datetime import datetime
from flask import current_app
from backend.app import db # db is from backend.app (global instance)
from backend.celery_worker import celery_app # Import celery_app from where it's defined and configured

from ..models.models import DataSource
from ..knowledge_graph.kg_manager import KnowledgeGraphManager
from ..code_parser.python_parser import parse_python_file
from ..vector_db.vector_store_manager import VectorStoreManager

@celery_app.task(bind=True)
def process_data_source_for_ai(self, data_source_id: str):
    current_app.logger.info(f"🚀 Task {self.request.id}: Starting processing for data source: {data_source_id}")
    data_source = db.session.get(DataSource, data_source_id)
    if not data_source:
        current_app.logger.error(f"Task failed: Data source {data_source_id} not found.")
        return {"status": "failed", "message": "Data source not found"}

    kg_manager = None
    vector_store_manager = None
    local_repo_path = os.path.join(current_app.config['REPO_CLONE_PATH'], data_source_id)

    try:
        # --- 1. Setup Phase ---
        kg_manager = KnowledgeGraphManager()
        vector_store_manager = VectorStoreManager()
        current_app.logger.info(f"Clearing any existing data for data source {data_source_id}...")
        kg_manager.clear_data_source_data(data_source_id)
        vector_store_manager.clear_data_source_data(data_source_id)
        current_app.logger.info(f"✅ Data cleared.")

        # --- 2. Code Fetching Phase ---
        repo_full_name = data_source.connection_details.get('repo_full_name')
        if not repo_full_name:
            raise ValueError("GitHub repo_full_name not found in connection_details.")
        clone_url = f"https://{current_app.config.get('GITHUB_PAT')}@github.com/{repo_full_name}.git"
        if os.path.exists(local_repo_path):
            shutil.rmtree(local_repo_path)
        current_app.logger.info(f"Cloning '{repo_full_name}'...")
        git.Repo.clone_from(clone_url, local_repo_path)
        current_app.logger.info(f"✅ Cloning successful.")
        
        # --- 3. Parsing & Directory Graph Construction ---
        current_app.logger.info("Phase 3: Starting AST parsing and directory graph construction...")
        parsed_files = {}

        for root, dirs, files in os.walk(local_repo_path, topdown=True):
            if any(d in root.split(os.sep) for d in ['.git', '__pycache__', 'node_modules', 'venv']):
                continue
            
            relative_dir_path = os.path.relpath(root, local_repo_path)
            if relative_dir_path == '.': # Ensure root directory is handled correctly
                kg_manager.add_directory_node(data_source_id, relative_dir_path)

            for dir_name in dirs:
                relative_child_dir_path = os.path.join(relative_dir_path, dir_name)
                kg_manager.add_directory_node(data_source_id, relative_child_dir_path)
                kg_manager.link_directory_to_child(data_source_id, relative_dir_path, relative_child_dir_path, 'Directory')

            for file_name in files:
                relative_file_path = os.path.relpath(os.path.join(root, file_name), local_repo_path)
                kg_manager.add_file_node(data_source_id, relative_file_path)
                kg_manager.link_directory_to_child(data_source_id, relative_dir_path, relative_file_path, 'File')

                if file_name.endswith('.py'):
                    try:
                        with open(os.path.join(root, file_name), 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            parsed_data = parse_python_file(content)
                            if parsed_data:
                                parsed_files[relative_file_path] = parsed_data
                    except Exception as parse_error:
                        current_app.logger.warning(f"Could not parse file {relative_file_path}: {parse_error}")
        
        current_app.logger.info(f"✅ Phase 3 Complete. Parsed {len(parsed_files)} Python files.")


        # --- 4. Deep Intelligence Graph Population (Two-Pass System) ---
        current_app.logger.info("Phase 4: Starting Deep Intelligence graph population...")

        # -- PASS 1: Create all nodes (Files, Classes, Functions) --
        current_app.logger.info("  -> Pass 1: Creating nodes...")
        for file_path, data in parsed_files.items():
            # Create Class nodes
            for class_data in data.get("classes", []):
                kg_manager.add_class_node(
                    data_source_id=data_source_id,
                    file_path=file_path,
                    class_name=class_data["name"],
                    docstring=class_data["docstring"],
                    base_classes=class_data["base_classes"]
                )
                # Create Method nodes (as functions linked to the class)
                for method_data in class_data.get("methods", []):
                    kg_manager.add_function_node(
                        data_source_id=data_source_id,
                        file_path=file_path,
                        function_name=method_data["name"],
                        docstring=method_data["docstring"],
                        class_name=class_data["name"]
                    )
            # Create standalone Function nodes
            for func_data in data.get("functions", []):
                kg_manager.add_function_node(
                    data_source_id=data_source_id,
                    file_path=file_path,
                    function_name=func_data["name"],
                    docstring=func_data["docstring"]
                )

        # -- PASS 2: Create all relationships (Imports, Calls) --
        current_app.logger.info("  -> Pass 2: Creating relationships...")
        for file_path, data in parsed_files.items():
            # Create IMPORT relationships
            for imp in data.get("imports", []):
                kg_manager.add_import_relationship(
                    data_source_id=data_source_id,
                    file_path=file_path,
                    module=imp.get("module"),
                    name=imp.get("name"),
                    asname=imp.get("asname")
                )
            # Create CALLS relationships for standalone functions
            for func_data in data.get("functions", []):
                for call in func_data.get("calls", []):
                    kg_manager.add_call_relationship(data_source_id, func_data["name"], file_path, call)
            # Create CALLS relationships for methods within classes
            for class_data in data.get("classes", []):
                for method_data in class_data.get("methods", []):
                    for call in method_data.get("calls", []):
                        kg_manager.add_call_relationship(data_source_id, method_data["name"], file_path, call)
        
        current_app.logger.info("✅ Phase 4 Complete. Deep Intelligence graph populated.")

        
        # --- 5. Vector DB Population (Semantic Layer) ---
        current_app.logger.info("Phase 5: Starting Vector DB population for semantic search...")
        text_chunks_for_embedding = []
        metadatas_for_embedding = []

        for file_path, data in parsed_files.items():
            # Add standalone functions
            for func_data in data.get("functions", []):
                text_chunk = (
                    f"Function: {func_data['name']}\n"
                    f"File: {file_path}\n"
                    f"Arguments: {', '.join(func_data['args']) if func_data['args'] else 'None'}\n"
                    f"Documentation:\n{func_data['docstring']}"
                )
                text_chunks_for_embedding.append(text_chunk)
                metadatas_for_embedding.append({"file_path": file_path, "function_name": func_data["name"], "type": "function"})
            # Add class methods
            for class_data in data.get("classes", []):
                 for method_data in class_data.get("methods", []):
                    text_chunk = (
                        f"Method: {class_data['name']}.{method_data['name']}\n"
                        f"File: {file_path}\n"
                        f"Arguments: {', '.join(method_data['args']) if method_data['args'] else 'None'}\n"
                        f"Documentation:\n{method_data['docstring']}"
                    )
                    text_chunks_for_embedding.append(text_chunk)
                    metadatas_for_embedding.append({"file_path": file_path, "function_name": method_data["name"], "type": "method", "class_name": class_data["name"]})

        if text_chunks_for_embedding:
            current_app.logger.info(f"Generating embeddings for {len(text_chunks_for_embedding)} code chunks...")
            vector_store_manager.generate_and_store_embeddings(
                text_chunks=text_chunks_for_embedding,
                metadatas=metadatas_for_embedding,
                data_source_id=data_source_id
            )
        current_app.logger.info("✅ Phase 5 Complete. Vector DB populated.")

        # --- 6. Finalize and Update Status ---
        data_source.status = 'indexed'
        data_source.last_indexed_at = datetime.utcnow()
        db.session.add(data_source)
        db.session.commit()
        current_app.logger.info(f"✅ Set data source {data_source_id} status to 'indexed'. All phases complete!")
        return {"status": "completed", "message": f"Data source {data_source.name} processed successfully."}

    except Exception as e:
        current_app.logger.error(f"❌ Task failed for data source {data_source_id}: {e}", exc_info=True)
        data_source_to_fail = db.session.get(DataSource, data_source_id)
        if data_source_to_fail:
            data_source_to_fail.status = 'failed'
            db.session.add(data_source_to_fail)
            db.session.commit()
        raise e
    finally:
        if kg_manager:
            kg_manager.close()
        if os.path.exists(local_repo_path):
            shutil.rmtree(local_repo_path)
            current_app.logger.info(f"Cleaned up cloned repo at {local_repo_path}")