# backend/app/extensions.py

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

# Core extensions (initialized in create_app)
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

# Optional base class for models
Base = db.Model
