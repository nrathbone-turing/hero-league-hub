# File: backend/scripts/seed_db.py
# Purpose: Load JSON seed data into the Flask DB.
# Notes:
# - Reads from backend/seeds/events.json, entrants.json, matches.json
# - Inserts into SQLAlchemy models via Flask app context.
# - Seeds exactly one admin user.
# - Resets Postgres sequences to avoid duplicate key issues.

import os
import json
from sqlalchemy.sql import text
from backend.app import create_app
from backend.app.extensions import db
from backend.app.models import Event, Entrant, Match, User

SEED_DIR = os.path.join(os.path.dirname(__file__), "..", "seeds")


def load_seed(filename):
    with open(os.path.join(SEED_DIR, filename), "r") as f:
        return json.load(f)


def run():
    app = create_app()
    with app.app_context():
        print("🌱 Seeding database...")

        events = load_seed("events.json")
        entrants = load_seed("entrants.json")
        matches = load_seed("matches.json")

        # Insert Events
        for e in events:
            db.session.add(
                Event(id=e["id"], name=e["name"], date=e["date"], status=e["status"])
            )

        # Insert Entrants
        for en in entrants:
            db.session.add(
                Entrant(
                    id=en["id"],
                    name=en["name"],
                    alias=en.get("alias"),
                    event_id=en["event_id"],
                    dropped=en.get("dropped", False),
                )
            )

        # Insert Matches
        for m in matches:
            db.session.add(
                Match(
                    id=m["id"],
                    round=m["round"],
                    entrant1_id=m["entrant1_id"],
                    entrant2_id=m["entrant2_id"],
                    scores=m.get("scores"),
                    winner_id=m.get("winner_id"),
                    event_id=m["event_id"],
                )
            )

        # Create admin user if not exists
        if not User.query.filter_by(email="admin@example.com").first():
            admin = User(username="admin", email="admin@example.com", is_admin=True)
            admin.set_password("admin")
            db.session.add(admin)

        # Create demo non-admin user if not exists
        if not User.query.filter_by(email="demo@example.com").first():
            demo = User(username="demo_user", email="demo_user@example.com", is_admin=False)
            demo.set_password("password123")
            db.session.add(demo)

        db.session.commit()

        # Reset sequences
        for table in ["events", "entrants", "matches"]:
            seq_sql = text(
                f"""
                SELECT setval(
                  pg_get_serial_sequence('{table}', 'id'),
                  COALESCE((SELECT MAX(id) FROM {table}), 1) + 1,
                  false
                )
            """
            )
            db.session.execute(seq_sql)

        db.session.commit()

        print(
            f"✅ Inserted {len(events)} events, "
            f"{len(entrants)} entrants, "
            f"{len(matches)} matches, "
            f"+ admin & demo users"
        )
        print("🔄 Sequences reset for events, entrants, and matches.")


if __name__ == "__main__":
    run()
