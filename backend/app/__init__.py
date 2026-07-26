from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from minio import Minio
import os

# 1. Initialize the db and minio_client objects here at the global level!
db = SQLAlchemy()

# Initialize MinIO client
minio_client = Minio(
    os.getenv('MINIO_ENDPOINT', 'localhost:9000'),
    access_key=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
    secret_key=os.getenv('MINIO_SECRET_KEY', 'minioadmin123'),
    secure=os.getenv('MINIO_SECURE', 'False').lower() in ('true', '1', 't')
)

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://dropbox_user:secretpassword@localhost:5432/dropbox_clone')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'super-secret-jwt-key')

    # Initialize extensions
    CORS(app)
    db.init_app(app)

    # 2. IMPORT MODELS HERE (Inside the function, after db is initialized)
    from .models import User, Folder, File

    # 3. Create database tables
    with app.app_context():
        db.create_all()

    # 4. Register Blueprints
    from .routes.auth import auth_bp
    from .routes.storage import storage_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(storage_bp, url_prefix='/api/storage')

    return app