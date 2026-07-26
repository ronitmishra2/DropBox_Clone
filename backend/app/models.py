from . import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    # Relationships
    files = db.relationship('File', backref='owner', lazy=True, cascade="all, delete-orphan")
    folders = db.relationship('Folder', backref='owner', lazy=True, cascade="all, delete-orphan")

class Folder(db.Model):
    __tablename__ = 'folders'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # The Self-Referential Trick: A folder can live inside another folder
    parent_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    
    # Relationships to get subfolders and files easily
    subfolders = db.relationship('Folder', backref=db.backref('parent', remote_side=[id]), cascade="all, delete-orphan")
    files = db.relationship('File', backref='folder', lazy=True, cascade="all, delete-orphan")
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class File(db.Model):
    __tablename__ = 'files'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    
    # This is the UUID name saved in MinIO to prevent collisions
    minio_object_name = db.Column(db.String(255), nullable=False, unique=True)
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # New: Files can now belong to a folder (If NULL, it lives on the main dashboard)
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)