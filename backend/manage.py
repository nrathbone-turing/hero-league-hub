# File: backend/manage.py
# Purpose: Flask CLI entrypoint for DB management and scripts.

from flask.cli import FlaskGroup
from flask_migrate import Migrate
from backend.app import create_app
from backend.app.extensions import db

# Create the app
app = create_app()
cli = FlaskGroup(app)

# Attach Migrate so "flask db" commands are registered
migrate = Migrate(app, db)

if __name__ == "__main__":
    cli()
