from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize the database instance
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships: allows us to easily get a user's files with user.files
    folders = db.relationship('Folder', backref='owner', lazy=True)
    files = db.relationship('File', backref='owner', lazy=True)


class Folder(db.Model):
    __tablename__ = 'folders'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # This is the magic for nested folders! 
    # If parent_id is NULL, the folder is in the root directory.
    parent_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships: allows us to get subfolders or files inside this folder
    subfolders = db.relationship('Folder', backref=db.backref('parent', remote_side=[id]), lazy=True)
    files = db.relationship('File', backref='folder', lazy=True)


class File(db.Model):
    __tablename__ = 'files'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False) # e.g., "vacation_photo.jpg"
    
    # We never save the file as "vacation_photo.jpg" in MinIO to avoid name collisions.
    # We save a unique UUID string in MinIO and store that reference here.
    minio_object_name = db.Column(db.String(255), nullable=False, unique=True) 
    
    size = db.Column(db.Integer, nullable=False) # Size in bytes
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # If folder_id is NULL, the file is sitting in the user's root directory
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)