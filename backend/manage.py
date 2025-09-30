# File: backend/manage.py
# Flask CLI entrypoint for DB management and scripts.

from flask.cli import FlaskGroup
from flask_migrate import Migrate
from backend.app import create_app
from backend.app.extensions import db

# Create the app
app = create_app()

# Register CLI group so "flask db" commands are available
cli = FlaskGroup(app)

# Attach Flask-Migrate with explicit migrations directory inside backend/
migrate = Migrate(app, db, directory="backend/migrations")

if __name__ == "__main__":
    cli()
