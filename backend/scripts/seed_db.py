# File: backend/scripts/seed_db.py
# Purpose: Load initial data into the Hero League Hub database.
# Notes:
# - Safe for repeated runs via TRUNCATE + RESTART IDENTITY.
# - Works with existing Flask app context (e.g., during tests).
# - Seeds events, heroes, users, entrants, and matches with fixed IDs.

import os
import json
from sqlalchemy import inspect, text
from flask import current_app
from backend.app import create_app
from backend.app.extensions import db
from backend.app.models import Event, Entrant, Match, User, Hero

SEED_DIR = os.path.join(os.path.dirname(__file__), "..", "seeds")


def load_seed(filename: str):
    """Read a JSON seed file."""
    path = os.path.join(SEED_DIR, filename)
    with open(path, "r") as f:
        return json.load(f)


def reset_tables():
    """Truncate all tables safely and restart primary key sequences."""
    tables = ["matches", "entrants", "users", "heroes", "events"]
    for t in tables:
        db.session.execute(text(f'TRUNCATE TABLE "{t}" RESTART IDENTITY CASCADE;'))
    db.session.commit()
    print("🧹 Tables truncated and IDs reset.")


def bump_sequence(table_name: str):
    """Ensure Postgres autoincrement sequence continues from MAX(id)+1."""
    db.session.execute(
        text(
            f"""
            SELECT setval(
                pg_get_serial_sequence(:table, 'id'),
                COALESCE((SELECT MAX(id) FROM {table_name}), 0) + 1,
                false
            );
            """
        ),
        {"table": table_name},
    )
    db.session.commit()


def run():
    """Main seeding workflow (reuses current Flask app if available)."""
    # Reuse active Flask app if inside app context (e.g., during pytest)
    app = current_app._get_current_object() if current_app else create_app()
    ctx_pushed = False

    if not current_app:
        ctx = app.app_context()
        ctx.push()
        ctx_pushed = True

    try:
        print("🌱 Seeding database...")

        # Verify tables exist
        inspector = inspect(db.engine)
        if "events" not in inspector.get_table_names():
            raise RuntimeError(
                "❌ Tables not found. Run migrations first: flask --app backend/manage.py db upgrade"
            )

        reset_tables()

        # --- Load seed data ---
        events = load_seed("events.json")
        entrants = load_seed("entrants.json")
        matches = load_seed("matches.json")
        users = load_seed("users.json")
        heroes = load_seed("superheros_all.json")

        # --- Phase 1: Events ---
        for e in events:
            db.session.add(Event(**e))
        db.session.commit()
        bump_sequence("events")
        print(f"✅ Inserted {len(events)} events")

        # --- Phase 2: Heroes ---
        for h in heroes:
            db.session.add(
                Hero(
                    id=h["id"],
                    name=h["name"],
                    full_name=h.get("biography", {}).get("fullName"),
                    image=h.get("images", {}).get("md"),
                    powerstats=h.get("powerstats"),
                    biography=h.get("biography"),
                    appearance=h.get("appearance"),
                    work=h.get("work"),
                    connections=h.get("connections"),
                    alias=h.get("slug"),
                    alignment=h.get("biography", {}).get("alignment"),
                )
            )
        db.session.commit()
        bump_sequence("heroes")
        print(f"✅ Inserted {len(heroes)} heroes")

        # --- Phase 3: Users ---
        for u in users:
            user = User(
                id=u["id"],
                username=u["username"],
                email=u["email"],
                is_admin=u.get("is_admin", False),
            )
            user.set_password(u.get("password", "password123"))
            db.session.add(user)
        db.session.commit()
        bump_sequence("users")
        print(f"✅ Inserted {len(users)} users")

        # Ensure demo/admin users exist
        if not User.query.filter_by(email="admin@example.com").first():
            admin = User(username="admin", email="admin@example.com", is_admin=True)
            admin.set_password("admin")
            db.session.add(admin)
        if not User.query.filter_by(email="demo@example.com").first():
            demo = User(username="demo_user", email="demo@example.com")
            demo.set_password("password123")
            db.session.add(demo)
        db.session.commit()
        bump_sequence("users")
        print("✅ Ensured admin & demo users")

        # --- Phase 4: Entrants ---
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
        db.session.commit()
        bump_sequence("entrants")
        print(f"✅ Inserted {len(entrants)} entrants")

        # --- Phase 5: Matches ---
        for m in matches:
            db.session.add(Match(**m))
        db.session.commit()
        bump_sequence("matches")
        print(f"✅ Inserted {len(matches)} matches")

        print("\n🎉 Seed complete! All sequences bumped and data loaded successfully.")
    finally:
        if ctx_pushed:
            ctx.pop()


if __name__ == "__main__":
    run()
