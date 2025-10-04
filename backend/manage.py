# File: backend/manage.py
# Purpose: Unified Flask CLI for migrations, seeding, and database utilities.
# Notes:
# - Works with Docker and Postgres.
# - Supports custom commands for drop, create, reset, and seed workflows.

import click
from flask.cli import FlaskGroup
from flask_migrate import Migrate
from backend.app import create_app
from backend.app.extensions import db

# Initialize app + CLI
app = create_app()
cli = FlaskGroup(app)
migrate = Migrate(app, db, directory="backend/migrations")


@cli.command("drop-db")
def drop_db():
    """Fully drop and recreate the public schema."""
    from sqlalchemy import text

    click.echo("💥 Dropping entire schema (public)...")
    db.session.execute(text("DROP SCHEMA public CASCADE;"))
    db.session.execute(text("CREATE SCHEMA public;"))
    db.session.commit()
    click.echo("🧹 Database schema fully reset.")


@cli.command("create-db")
def create_db():
    """Create all tables from current models."""
    click.echo("🛠️ Creating all tables...")
    db.create_all()
    click.echo("✅ Database tables created.")


@cli.command("reset-db")
def reset_db():
    """Drop and recreate all tables."""
    click.echo("🔄 Resetting database...")
    db.drop_all()
    db.create_all()
    click.echo("✅ Database reset complete.")


@cli.command("seed-db")
def seed_db():
    """Run the seed script."""
    from backend.scripts.seed_db import run

    click.echo("🌱 Seeding database...")
    run()
    click.echo("✅ Seeding complete.")


if __name__ == "__main__":
    cli()
