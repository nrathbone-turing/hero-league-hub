# File: backend/tests/test_routes_heroes.py
# Purpose: API route tests for Hero resource (search + id fetch).
# Notes:
# - Uses mock_hero_api fixture to avoid real Superhero API calls.
# - Confirms DB persistence after first fetch.
# - Ensures normalized fields (name, powerstats, biography, etc.) are present.

import pytest
from backend.app.models import Hero
from backend.app.extensions import db


def test_get_hero_by_id(client, session, mock_hero_api):
    """Should fetch a hero by ID and persist it in the DB."""
    resp = client.get("/api/heroes/70")
    assert resp.status_code == 200
    data = resp.get_json()

    # basic fields
    assert data["id"] == 70
    assert data["name"] == "Batman"
    assert data["powerstats"]["intelligence"] == "100"

    # persisted in DB
    stored = db.session.get(Hero, 70)
    assert stored is not None
    assert stored.name == "Batman"
    assert "combat" in stored.powerstats


def test_search_heroes(client, session, mock_hero_api):
    """Should search heroes by name and return normalized results."""
    resp = client.get("/api/heroes?search=batman")
    assert resp.status_code == 200
    data = resp.get_json()

    # single Batman result
    assert isinstance(data, list)
    assert len(data) == 1
    hero = data[0]
    assert hero["name"] == "Batman"
    assert "biography" in hero
    assert "appearance" in hero
    assert "connections" in hero

    # persisted in DB
    stored = db.session.get(Hero, hero["id"])
    assert stored is not None
    assert stored.name == "Batman"


def test_search_missing_query_returns_400(client):
    """Should return 400 if search query param is missing."""
    resp = client.get("/api/heroes")
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Missing search query"
