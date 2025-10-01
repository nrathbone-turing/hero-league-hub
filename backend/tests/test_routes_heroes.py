# File: backend/tests/test_routes_heroes.py
# Purpose: Tests for /api/heroes routes (search + get by ID).
# Notes:
# - Matches new backend contract: JSON includes { results, page, per_page, total, total_pages }.
# - Uses monkeypatch to fake external API responses.
# - Validates persistence, normalization, pagination, and error handling.

import pytest
from backend.app.models.models import Hero

# ------------------------------
# Fixtures
# ------------------------------
BATMAN_SEARCH = {
    "results": [
        {
            "id": "70",
            "name": "Batman",
            "powerstats": {"intelligence": "100"},
            "image": {"url": "http://batman.jpg"},
            "biography": {"full-name": "Bruce Wayne"},
            "appearance": {"gender": "Male", "race": "Human"},
            "work": {"occupation": "Vigilante"},
            "connections": {"group-affiliation": "Justice League"},
        }
    ]
}

BATMAN_SINGLE = {
    "id": "70",
    "name": "Batman",
    "powerstats": {"intelligence": "100"},
    "image": {"url": "http://batman.jpg"},
    "biography": {"full-name": "Bruce Wayne"},
    "appearance": {"gender": "Male", "race": "Human"},
    "work": {"occupation": "Vigilante"},
    "connections": {"group-affiliation": "Justice League"},
}

SUPERMAN_SEARCH = {
    "results": [
        {
            "id": "644",
            "name": "Superman",
            "powerstats": {"strength": "100"},
            "image": {"url": "http://superman.jpg"},
        }
    ]
}


# ------------------------------
# Tests: Search
# ------------------------------
def test_search_heroes(client, monkeypatch):
    """Should return normalized hero list from search with pagination metadata."""

    def fake_get(url):
        class FakeResp:
            ok = True
            def json(self): return BATMAN_SEARCH
        return FakeResp()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_get)

    resp = client.get("/api/heroes?search=batman&page=1")
    assert resp.status_code == 200
    data = resp.get_json()

    assert "results" in data
    assert isinstance(data["results"], list)
    assert len(data["results"]) == 1
    assert data["results"][0]["name"] == "Batman"
    assert data["results"][0]["full_name"] == "Bruce Wayne"
    assert "alias" in data["results"][0]
    assert "alignment" in data["results"][0]
    assert data["page"] == 1
    assert data["total"] == 1
    assert data["total_pages"] == 1


def test_search_heroes_missing_query(client):
    """Should return 400 when search query is missing."""
    resp = client.get("/api/heroes")
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_search_heroes_external_api_error(client, monkeypatch):
    """Should bubble up external API error codes."""

    def fake_get(url):
        class FakeResp:
            ok = False
            status_code = 503
            def json(self): return {}
        return FakeResp()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_get)

    resp = client.get("/api/heroes?search=batman")
    assert resp.status_code == 503
    assert "error" in resp.get_json()


def test_search_heroes_pagination(client, monkeypatch):
    """Should paginate results when more than one page exists."""

    def fake_get(url):
        # emulate multiple results from API
        class FakeResp:
            ok = True
            def json(self):
                return {
                    "results": [
                        {"id": "70", "name": "Batman", "powerstats": {}},
                        {"id": "644", "name": "Superman", "powerstats": {}},
                    ]
                }
        return FakeResp()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_get)

    # Page 1
    resp = client.get("/api/heroes?search=batman&page=1&per_page=1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data["results"]) == 1
    assert data["page"] == 1
    assert data["total"] == 2
    assert data["total_pages"] == 2

    # Page 2
    resp2 = client.get("/api/heroes?search=batman&page=2&per_page=1")
    assert resp2.status_code == 200
    data2 = resp2.get_json()
    assert len(data2["results"]) == 1
    assert data2["page"] == 2
    assert data2["total"] == 2
    assert data2["total_pages"] == 2


# ------------------------------
# Tests: Get by ID
# ------------------------------
def test_get_hero_from_db(client, session):
    """Should return hero from DB if already persisted."""
    hero = Hero(
        id=70,
        name="Batman",
        image="http://batman.jpg",
        powerstats={"intelligence": 100},
    )
    session.add(hero)
    session.commit()

    resp = client.get("/api/heroes/70")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["name"] == "Batman"


def test_get_hero_fetch_from_api(client, monkeypatch, session):
    """Should fetch hero from external API if not in DB and persist it."""

    def fake_get(url):
        class FakeResp:
            ok = True
            def json(self): return BATMAN_SINGLE
        return FakeResp()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_get)

    resp = client.get("/api/heroes/70")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["name"] == "Batman"

    # persisted
    hero = session.get(Hero, 70)
    assert hero is not None
    assert hero.name == "Batman"


def test_get_hero_external_api_error(client, monkeypatch):
    """Should bubble up external API error codes on single hero fetch."""

    def fake_get(url):
        class FakeResp:
            ok = False
            status_code = 404
            def json(self): return {}
        return FakeResp()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_get)

    resp = client.get("/api/heroes/99999")
    assert resp.status_code == 404
    assert "error" in resp.get_json()


def test_normalize_hero_alignment_mapping(client, monkeypatch):
    """Should map API alignment values to canonical ones (hero/villain/antihero/unknown)."""

    mock_result = {
        "id": "123",
        "name": "Test Hero",
        "biography": {"full-name": "Testy McTest", "alignment": "bad"},
        "image": {"url": "http://test.jpg"},
    }

    def fake_get(url):
        class FakeResp:
            ok = True
            def json(self): return {"results": [mock_result]}
        return FakeResp()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_get)

    resp = client.get("/api/heroes?search=test")
    assert resp.status_code == 200
    data = resp.get_json()
    hero = data["results"][0]

    assert hero["alignment"] == "villain"   # "bad" → "villain"
    assert hero["full_name"] == "Testy McTest"

