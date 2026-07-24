import os
from dotenv import load_dotenv

# Get the absolute path of the directory two levels up (the 'backend' folder)
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

# Load the .env file from that backend folder
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # Flask Settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-key')
    
    # SQLAlchemy (Postgres) Settings
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # MinIO Settings
    MINIO_ENDPOINT = os.environ.get('MINIO_ENDPOINT', 'localhost:9000')
    MINIO_ACCESS_KEY = os.environ.get('MINIO_ACCESS_KEY', 'minioadmin')
    MINIO_SECRET_KEY = os.environ.get('MINIO_SECRET_KEY', 'minioadmin123')
    
    # Convert string "False" to actual boolean False
    MINIO_SECURE = os.environ.get('MINIO_SECURE', 'False').lower() in ('true', '1', 't')