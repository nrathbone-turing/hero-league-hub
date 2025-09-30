# File: backend/scripts/clear_db.py
# Purpose: Drop and recreate all tables.

from backend.app import create_app
from backend.app.models import db

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()
    print("💥 All tables dropped & recreated fresh.")
