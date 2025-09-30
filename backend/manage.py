# File: backend/manage.py
# Purpose: Flask CLI entrypoint for DB management and scripts.

from flask.cli import FlaskGroup
from backend.app import create_app

app = create_app()
cli = FlaskGroup(app)

if __name__ == "__main__":
    cli()
