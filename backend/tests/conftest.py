# File: backend/tests/conftest.py
# Purpose: Global pytest fixtures for backend tests.
# Provides:
# - app, client, session
# - create_event, create_user, create_hero, seed_event_with_entrants
# - auth_user_and_header (User + JWT header)
# - mock_hero_api (patch Superhero API)
# - seed_full_db (session-scoped seed for analytics tests)

import pytest
from backend.app import create_app
from backend.app.models import Event, Entrant, User, Hero
from backend.app.extensions import db
from backend.app.config import TestConfig
from flask_jwt_extended import create_access_token
from unittest.mock import patch
from sqlalchemy import text


# ------------------------------
# Core fixtures
# ------------------------------

@pytest.fixture(scope="session")
def app():
    """Create a Flask app instance for testing with TestConfig."""
    app = create_app(TestConfig)
    return app


@pytest.fixture(autouse=True)
def reset_db(app, request):
    """Reset schema before each test for isolation.
    Skips analytics tests (they reuse a large seeded DB).
    """
    if "analytics" in request.keywords:
        yield
        return

    with app.app_context():
        db.drop_all()
        db.create_all()
        yield
        db.session.remove()


@pytest.fixture
def client(app):
    """Provide Flask test client for making HTTP requests."""
    return app.test_client()


@pytest.fixture
def session(app):
    """Provide SQLAlchemy session for direct DB access."""
    with app.app_context():
        yield db.session
        db.session.rollback()


# ------------------------------
# Entity creators
# ------------------------------

@pytest.fixture
def create_event(session):
    """Factory fixture to create and persist Event objects."""

    def _create_event(**kwargs):
        event = Event(
            name=kwargs.get("name", "Test Cup"),
            date=kwargs.get("date", "2025-09-12"),
            rules=kwargs.get("rules", "Bo3"),
            status=kwargs.get("status", "drafting"),
        )
        session.add(event)
        session.commit()
        return event

    return _create_event


@pytest.fixture
def create_user(session):
    """Factory fixture to create and persist User objects."""

    def _create_user(username="player1", email="player1@test.com", password="fake"):
        user = User(username=username, email=email)
        user.set_password(password)
        session.add(user)
        session.commit()
        return user

    return _create_user


@pytest.fixture
def create_hero(session):
    """Factory fixture to create and persist Hero objects."""

    def _create_hero(hero_id=999, name="Batman"):
        hero = Hero(
            id=hero_id,
            name=name,
            image="http://fake.jpg",
            powerstats={"intelligence": 100},
        )
        session.add(hero)
        session.commit()
        return hero

    return _create_hero


@pytest.fixture
def seed_event_with_entrants(session, create_event):
    """Seed a published event with two entrants for match tests."""

    def _seed_event_with_entrants():
        event = create_event(name="Match Cup", status="published")
        e1 = Entrant(name="Hero A", alias="Alpha", event_id=event.id)
        e2 = Entrant(name="Hero B", alias="Beta", event_id=event.id)
        session.add_all([e1, e2])
        session.commit()
        return event, e1, e2

    return _seed_event_with_entrants


@pytest.fixture
def auth_user_and_header(app, session):
    """Provide (user, header) tuple with a valid JWT."""
    user = User(username="authuser", email="auth@test.com")
    user.set_password("password")
    session.add(user)
    session.commit()

    with app.app_context():
        token = create_access_token(identity=str(user.id))
        header = {"Authorization": f"Bearer {token}"}
        return user, header


# ------------------------------
# API mocking helpers
# ------------------------------

@pytest.fixture
def mock_hero_api():
    """Monkeypatch requests.get to fake Superhero API response."""

    fake_response = {
        "response": "success",
        "results": [
            {
                "id": "70",
                "name": "Batman",
                "powerstats": {"intelligence": "100"},
                "biography": {"full-name": "Bruce Wayne"},
                "image": {"url": "http://batman.jpg"},
            }
        ],
    }

    class DummyResp:
        ok = True
        status_code = 200

        def json(self):
            return fake_response

    with patch("backend.app.routes.heroes.requests.get", return_value=DummyResp()):
        yield


# ------------------------------
# Analytics seed fixture (session-scoped)
# ------------------------------

@pytest.fixture(scope="session")
def seed_full_db(app):
    """Seed full dataset once per session for analytics tests."""
    from backend.scripts import seed_db

    with app.app_context():
        print("🔄 Resetting tables for analytics seed...")
        db.session.execute(text("""
            TRUNCATE TABLE
                matches,
                entrants,
                users,
                heroes,
                events
            RESTART IDENTITY CASCADE;
        """))
        db.session.commit()

        print("🌱 Seeding database for analytics tests (session scope)...")
        seed_db.run()
        print("✅ Analytics seed complete (shared for all analytics tests).")
