import uuid
import jwt
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from app.models import db, File, User
from datetime import timedelta

# Import the minio_client we initialized in __init__.py
from app import minio_client 

storage_bp = Blueprint('storage', __name__, url_prefix='/api/storage')

# --- SECURITY MIDDLEWARE ---
def token_required(f):
    """Checks if the user sent a valid JWT token in the Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        try:
            # Token usually comes in as "Bearer <actual_token>"
            token = token.split(" ")[1] 
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except Exception as e:
            return jsonify({'error': 'Token is invalid or expired!'}), 401
            
        # Pass the current_user to the route being protected
        return f(current_user, *args, **kwargs)
    return decorated


# --- UPLOAD ROUTE ---
@storage_bp.route('/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    # 1. Generate a unique name for MinIO to prevent name collisions
    file_extension = file.filename.split('.')[-1]
    minio_object_name = f"{uuid.uuid4().hex}.{file_extension}"
    
    # Calculate file size
    file_bytes = file.read()
    size = len(file_bytes)
    file.seek(0) # Reset file pointer back to the start so MinIO can read it
    
    # 2. Upload the actual bytes to MinIO
    minio_client.put_object(
        "dropbox-files",
        minio_object_name,
        file,
        size
    )
    
    # 3. Save the friendly metadata to PostgreSQL
    new_file = File(
        name=file.filename,
        minio_object_name=minio_object_name,
        size=size,
        user_id=current_user.id
        # Note: folder_id is NULL here, so it goes to the user's root directory
    )
    db.session.add(new_file)
    db.session.commit()
    
    return jsonify({
        'message': 'File uploaded successfully', 
        'filename': file.filename
    }), 201

# --- LIST FILES ROUTE ---
@storage_bp.route('/files', methods=['GET'])
@token_required
def list_files(current_user):
    # Fetch all files belonging to the logged-in user
    files = File.query.filter_by(user_id=current_user.id).all()
    
    file_list = []
    for f in files:
        file_list.append({
            'id': f.id,
            'name': f.name,
            'size': f.size,
            'created_at': f.created_at.isoformat()
        })
        
    return jsonify({'files': file_list}), 200


# --- DOWNLOAD ROUTE ---
@storage_bp.route('/download/<int:file_id>', methods=['GET'])
@token_required
def download_file(current_user, file_id):
    # 1. Find the file in Postgres AND verify this user owns it
    file_record = File.query.filter_by(id=file_id, user_id=current_user.id).first()
    
    if not file_record:
        return jsonify({'error': 'File not found or unauthorized'}), 404
        
    # 2. Ask MinIO for a temporary, secure download link
    try:
        url = minio_client.presigned_get_object(
            bucket_name="dropbox-files",
            object_name=file_record.minio_object_name,
            expires=timedelta(hours=1), # Link expires in 1 hour
            response_headers={
                'response-content-disposition': f'attachment; filename="{file_record.name}"'
            }
        )
        
        return jsonify({
            'message': 'Download link generated successfully',
            'download_url': url,
            'file_name': file_record.name
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate download link', 'details': str(e)}), 500