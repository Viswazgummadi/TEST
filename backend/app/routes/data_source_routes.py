# backend/app/routes/data_source_routes.py

from flask import Blueprint, request, jsonify, current_app
from ..models import db, DataSource

data_source_bp = Blueprint('data_source_api_routes', __name__)

@data_source_bp.route('/', methods=['GET'])
def get_data_sources():
    """
    Fetches all connected data sources from the database.
    """
    try:
        sources = DataSource.query.order_by(DataSource.created_at.desc()).all()
        return jsonify([source.to_dict() for source in sources]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching data sources: {e}", exc_info=True)
        return jsonify({"error": "Failed to retrieve data sources"}), 500

@data_source_bp.route('/connect', methods=['POST'])
def connect_data_source():
    """
    Creates a new DataSource record in the database from a given repository.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    source_type = data.get('source_type')
    repo_owner = data.get('repo_owner')
    repo_name = data.get('repo_name')

    if not all([source_type, repo_owner, repo_name]):
        return jsonify({"error": "Missing required fields: source_type, repo_owner, repo_name"}), 400
    
    if source_type != 'github_repository':
        return jsonify({"error": f"Source type '{source_type}' is not supported yet."}), 400

    connection_details = {"owner": repo_owner, "repo_name": repo_name}

    try:
        existing_source = DataSource.query.filter_by(connection_details=connection_details).first()
        if existing_source:
            return jsonify({"error": f"Repository '{repo_owner}/{repo_name}' is already connected."}), 409

        new_source = DataSource(
            name=repo_name,
            source_type=source_type,
            connection_details=connection_details,
            status='pending_indexing'
        )
        
        db.session.add(new_source)
        db.session.commit()
        
        current_app.logger.info(f"Successfully connected new data source: {new_source.name} ({new_source.id})")
        return jsonify(new_source.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error connecting data source: {e}", exc_info=True)
        return jsonify({"error": "Failed to connect new data source"}), 500

@data_source_bp.route('/<string:data_source_id>', methods=['DELETE'])
def delete_data_source(data_source_id):
    """
    Deletes a connected data source from the database.
    """
    try:
        source_to_delete = DataSource.query.get_or_404(data_source_id, description="Data source not found")
            
        db.session.delete(source_to_delete)
        db.session.commit()
        
        current_app.logger.info(f"Successfully deleted data source: {source_to_delete.name} ({data_source_id})")
        return jsonify({"message": "Data source deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting data source {data_source_id}: {e}", exc_info=True)
        return jsonify({"error": "Failed to delete data source"}), 500