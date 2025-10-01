# File: backend/tests/test_routes_heroes.py
# Purpose: API route tests for Hero resource (fetch + persistence).
# Notes:
# - Validates hero search, fetch by id, and persistence in DB.
# - Uses mock/fallback data when API_KEY is missing.

import pytest
from backend.app.models import Hero
from backend.app.extensions import db


def test_get_hero_by_id(client, session, monkeypatch):
    # Monkeypatch fetch to avoid external API call
    def fake_fetch(url):
        class FakeResponse:
            def __init__(self):
                self.ok = True
            def json(self):
                return {
                    "id": "1",
                    "name": "TestHero",
                    "image": {"url": "http://image.test/1.jpg"},
                    "powerstats": {"strength": "100", "speed": "80"},
                }
        return FakeResponse()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_fetch)

    resp = client.get("/api/heroes/1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["name"] == "TestHero"
    assert "powerstats" in data


def test_hero_is_persisted(client, session):
    hero = Hero(id=2, name="StoredHero", image="http://img/2.jpg", powerstats={"intelligence": "90"})
    session.add(hero)
    session.commit()

    stored = db.session.get(Hero, 2)
    assert stored.name == "StoredHero"
    assert "intelligence" in stored.powerstats


def test_search_hero(client, monkeypatch):
    def fake_fetch(url):
        class FakeResponse:
            def __init__(self):
                self.ok = True
            def json(self):
                return {
                    "results": [
                        {
                            "id": "10",
                            "name": "SearchHero",
                            "image": {"url": "http://img/10.jpg"},
                            "powerstats": {"durability": "75"},
                        }
                    ]
                }
        return FakeResponse()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_fetch)

    resp = client.get("/api/heroes/search?q=searchhero")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["name"] == "SearchHero"
