# File: backend/scripts/seed_db.py
# Purpose: Load JSON seed data into the Flask DB.
# Notes:
# - Reads from backend/seeds/events.json, entrants.json, matches.json, users.json
# - Inserts into SQLAlchemy models via Flask app context.
# - Passwords from users.json are hashed before insert.
# - Resets Postgres sequences to avoid duplicate key issues.

import os
import json
from sqlalchemy.sql import text
from backend.app import create_app
from backend.app.extensions import db
from backend.app.models import Event, Entrant, Match, User, Hero

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
        users = load_seed("users.json")

        # Insert Events
        for e in events:
            db.session.add(
                Event(id=e["id"], name=e["name"], date=e["date"], status=e["status"])
            )

        # Insert Users (hash passwords)
        for u in users:
            user = User(
                id=u["id"],
                username=u["username"],
                email=u["email"],
                is_admin=u.get("is_admin", False),
            )
            user.set_password(u.get("password", "password123"))
            db.session.add(user)

        # Insert Entrants (linked to users + heroes)
        for en in entrants:
            db.session.add(
                Entrant(
                    id=en["id"],
                    name=en["name"],
                    alias=en.get("alias"),
                    event_id=en["event_id"],
                    user_id=en.get("user_id"),
                    hero_id=en.get("hero_id"),
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

        # Insert demo hero if not exists
        if not Hero.query.get(999):
            demo_hero = Hero(
                id=999,
                name="Demo Hero",
                image="http://demo-hero.jpg",
                powerstats={"strength": 50, "intelligence": 50},
            )
            db.session.add(demo_hero)

        db.session.commit()

        # Reset sequences
        for table in ["events", "entrants", "matches", "users", "heroes"]:
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
            f"{len(users)} users, "
            f"{len(entrants)} entrants, "
            f"{len(matches)} matches, "
            f"+ demo hero"
        )
        print("🔄 Sequences reset for all tables.")


if __name__ == "__main__":
    run()
