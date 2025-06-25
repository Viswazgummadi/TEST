# backend/models.py
import datetime
from flask_sqlalchemy import SQLAlchemy

# Define the db object here. It will be initialized with the Flask app in app.py
db = SQLAlchemy()

class AdminUser(db.Model):
    __tablename__ = 'admin_user'  # Explicit table name

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    # Increased length for bcrypt hashes which can be around 60 chars
    # Storing them as String(128) or even Text might be safer depending on bcrypt version/settings
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def __repr__(self):
        return f'<AdminUser {self.username}>'

class APIKey(db.Model):
    __tablename__ = 'api_key'  # Explicit table name

    id = db.Column(db.Integer, primary_key=True)
    service_name = db.Column(db.String(100), unique=True, nullable=False)
    # Encrypted data can be longer, ensure this is sufficient.
    # Fernet encrypted strings are base64, so length varies. 500 should be okay.
    key_value_encrypted = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def __repr__(self):
        return f'<APIKey {self.service_name}>'

# You can add more models here as your application grows