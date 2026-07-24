from flask import Flask
from flask_cors import CORS
from minio import Minio
from app.config import Config
from app.models import db

# We will initialize the MinIO client inside the factory function
minio_client = None

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Allow the React frontend to communicate with this API
    CORS(app)
    
    # Initialize the Postgres Database
    db.init_app(app)
    
    # Initialize the MinIO Client globally
    global minio_client
    minio_client = Minio(
        app.config['MINIO_ENDPOINT'],
        access_key=app.config['MINIO_ACCESS_KEY'],
        secret_key=app.config['MINIO_SECRET_KEY'],
        secure=app.config['MINIO_SECURE']
    )
    
    # THIS IS THE SECTION YOU ASKED ABOUT
    with app.app_context():
        # Import models so SQLAlchemy knows what tables to create
        from app.models import User, Folder, File
        
        # Create all tables in Postgres if they don't exist yet
        db.create_all()
        
        # Ensure the MinIO bucket exists
        bucket_name = "dropbox-files"
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name)
            print(f"Created MinIO bucket: {bucket_name}")
            
        # REGISTER ROUTES HERE
        from app.routes.auth import auth_bp
        app.register_blueprint(auth_bp)
        
        from app.routes.storage import storage_bp
        app.register_blueprint(storage_bp)
        
    # Your health check route
    @app.route('/')
    def hello():
        return {"status": "success", "message": "Dropbox clone backend is running!"}
            
    return app