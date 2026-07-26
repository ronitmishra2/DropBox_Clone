import uuid
from datetime import timedelta
from flask import Blueprint, request, jsonify
from app import db, minio_client
from app.models import File, Folder
from app.routes.auth import token_required  # Assuming your token_required decorator is in auth.py

# 1. Define the Blueprint (This is what was missing!)
storage_bp = Blueprint('storage', __name__)

# --- FILE ROUTES ---

@storage_bp.route('/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Grab the folder_id from the frontend request
    folder_id = request.form.get('folder_id')
    
    # Clean up the folder_id 
    if not folder_id or folder_id == 'null':
        folder_id = None
    else:
        folder_id = int(folder_id)

    try:
        # Generate a unique name for MinIO to prevent collisions
        unique_filename = str(uuid.uuid4())
        
        # Read the file size
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0, 0)

        # Upload the physical file to MinIO
        minio_client.put_object(
            "dropbox-files",
            unique_filename,
            file,
            length=file_size,
            content_type=file.content_type
        )

        # Save the metadata to PostgreSQL
        new_file = File(
            name=file.filename,
            size=file_size,
            minio_object_name=unique_filename,
            user_id=current_user.id,
            folder_id=folder_id
        )
        
        db.session.add(new_file)
        db.session.commit()

        return jsonify({
            'message': 'File uploaded successfully', 
            'file': {'id': new_file.id, 'name': new_file.name}
        }), 201

    except Exception as e:
        return jsonify({'error': 'Failed to upload file', 'details': str(e)}), 500


@storage_bp.route('/download/<int:file_id>', methods=['GET'])
@token_required
def download_file(current_user, file_id):
    file = File.query.filter_by(id=file_id, user_id=current_user.id).first()
    if not file:
        return jsonify({'error': 'File not found'}), 404

    try:
        # Generate Presigned URL
        url = minio_client.get_presigned_url(
            "GET",
            "dropbox-files",
            file.minio_object_name,
            expires=timedelta(hours=1)
        )
        return jsonify({'download_url': url, 'file_name': file.name}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to generate download link', 'details': str(e)}), 500


@storage_bp.route('/files/<int:file_id>', methods=['DELETE'])
@token_required
def delete_file(current_user, file_id):
    file = File.query.filter_by(id=file_id, user_id=current_user.id).first()
    if not file:
        return jsonify({'error': 'File not found'}), 404

    try:
        # Delete from MinIO
        minio_client.remove_object("dropbox-files", file.minio_object_name)
        
        # Delete from Database
        db.session.delete(file)
        db.session.commit()
        
        return jsonify({'message': 'File deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to delete file', 'details': str(e)}), 500


# --- FOLDER ROUTES ---

@storage_bp.route('/folders', methods=['POST'])
@token_required
def create_folder(current_user):
    data = request.get_json()
    folder_name = data.get('name')
    parent_id = data.get('parent_id')

    if not folder_name:
        return jsonify({'error': 'Folder name is required'}), 400

    new_folder = Folder(
        name=folder_name,
        user_id=current_user.id,
        parent_id=parent_id
    )

    db.session.add(new_folder)
    db.session.commit()

    return jsonify({'message': 'Folder created successfully', 'folder': {'id': new_folder.id, 'name': new_folder.name}}), 201


@storage_bp.route('/directory', methods=['GET'])
@token_required
def get_directory(current_user):
    folder_id = request.args.get('folder_id', type=int)

    # Fetch folders and files for this specific directory
    folders = Folder.query.filter_by(user_id=current_user.id, parent_id=folder_id).all()
    files = File.query.filter_by(user_id=current_user.id, folder_id=folder_id).all()

    folder_list = [{'id': f.id, 'name': f.name} for f in folders]
    file_list = [{'id': f.id, 'name': f.name, 'size': f.size} for f in files]

    return jsonify({
        'current_folder_id': folder_id,
        'folders': folder_list,
        'files': file_list
    }), 200