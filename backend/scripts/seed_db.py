# File: backend/scripts/seed_db.py
# Purpose: Load JSON seed data into the Flask DB.
# Notes:
# - Reads from backend/seeds/events.json, entrants.json, matches.json, users.json, superheros_all.json
# - Inserts in phases with commits between phases to avoid autoflush collisions.
# - Bumps sequences after fixed-ID inserts before adding extras (admin/demo).
# - Passwords from users.json are hashed before insert.
# - Resets Postgres sequences at the end as well.

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


def bump_sequence(table_name: str):
    """
    Set the sequence for `table_name.id` to MAX(id)+1 to ensure autoincrement
    does not collide with fixed IDs we just inserted.
    """
    setval_sql = text(
        """
        SELECT setval(
            pg_get_serial_sequence(:table, 'id'),
            COALESCE((SELECT MAX(id) FROM """
        + table_name
        + """), 0) + 1,
            false
        )
    """
    )
    db.session.execute(setval_sql, {"table": table_name})


def run():
    app = create_app()
    with app.app_context():
        print("🌱 Seeding database...")

        events = load_seed("events.json")
        entrants = load_seed("entrants.json")
        matches = load_seed("matches.json")
        users = load_seed("users.json")
        heroes = load_seed("superheros_all.json")

        # -------------------------
        # Phase 1: Events
        # -------------------------
        for e in events:
            db.session.add(
                Event(
                    id=e["id"],
                    name=e["name"],
                    date=e.get("date"),
                    status=e["status"],
                )
            )
        db.session.commit()
        bump_sequence("events")
        db.session.commit()
        print(f"✅ Inserted {len(events)} events")

        # -------------------------
        # Phase 2: Heroes
        # (must be before Entrants to satisfy FK)
        # -------------------------
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
        db.session.commit()
        print(f"✅ Inserted {len(heroes)} heroes")

        # -------------------------
        # Phase 3: Users from JSON (fixed IDs)
        # -------------------------
        for u in users:
            user = User(
                id=u["id"],
                username=u["username"],
                email=u["email"],
                is_admin=u.get("is_admin", False),
            )
            # If your users.json has no password, we still hash a default:
            user.set_password(u.get("password", "password123"))
            db.session.add(user)
        db.session.commit()
        bump_sequence("users")
        db.session.commit()
        print(f"✅ Inserted {len(users)} users")

        # -------------------------
        # Phase 4: Ensure extras (admin + demo) exist
        # (use no_autoflush to avoid any pending autoflush)
        # Now safe: users sequence points past MAX(id)
        # -------------------------
        with db.session.no_autoflush:
            if not User.query.filter_by(email="admin@example.com").first():
                admin = User(username="admin", email="admin@example.com", is_admin=True)
                admin.set_password("admin")
                db.session.add(admin)

            if not User.query.filter_by(email="demo@example.com").first():
                demo = User(
                    username="demo_user", email="demo@example.com", is_admin=False
                )
                demo.set_password("password123")
                db.session.add(demo)

        db.session.commit()
        bump_sequence("users")
        db.session.commit()
        print("✅ Ensured admin & demo users (auto IDs)")

        # -------------------------
        # Phase 5: Entrants (fixed IDs)
        # (Users & Heroes must already exist)
        # -------------------------
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
        db.session.commit()
        print(f"✅ Inserted {len(entrants)} entrants")

        # -------------------------
        # Phase 6: Matches (fixed IDs)
        # -------------------------
        for m in matches:
            db.session.add(
                Match(
                    id=m["id"],
                    round=m.get("round"),
                    entrant1_id=m.get("entrant1_id"),
                    entrant2_id=m.get("entrant2_id"),
                    scores=m.get("scores"),
                    winner_id=m.get("winner_id"),
                    event_id=m["event_id"],
                )
            )
        db.session.commit()
        bump_sequence("matches")
        db.session.commit()
        print(f"✅ Inserted {len(matches)} matches")

        # -------------------------
        # Final: safety bump all sequences
        # -------------------------
        for table in ["events", "entrants", "matches", "users", "heroes"]:
            bump_sequence(table)
        db.session.commit()

        print(
            "🎉 Seed complete:\n"
            f"   Events:   {len(events)}\n"
            f"   Heroes:   {len(heroes)}\n"
            f"   Users:    {len(users)} (+admin/demo if missing)\n"
            f"   Entrants: {len(entrants)}\n"
            f"   Matches:  {len(matches)}\n"
            "🔄 Sequences bumped."
        )


if __name__ == "__main__":
    run()
