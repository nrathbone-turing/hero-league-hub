# backend/tests/test_routes_heroes.py

import pytest
from backend.app.models import Hero
from backend.app.extensions import db

BATMAN_SEARCH = {
    "response": "success",
    "results-for": "batman",
    "results": [
        {
            "id": "70",
            "name": "Batman",
            "powerstats": {
                "intelligence": "100",
                "strength": "26",
                "speed": "27",
                "durability": "50",
                "power": "47",
                "combat": "100",
            },
            "biography": {"full-name": "Bruce Wayne"},
            "appearance": {"gender": "Male", "race": "Human"},
            "work": {"occupation": "Businessman"},
            "connections": {"group-affiliation": "Justice League"},
            "image": {"url": "https://www.superherodb.com/pictures2/portraits/10/100/639.jpg"},
        }
    ],
}


def test_get_hero_by_id(client, session, monkeypatch):
    def fake_get(url):
        class FakeResp:
            ok = True
            def json(self):
                return BATMAN_SEARCH["results"][0]
        return FakeResp()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_get)

    resp = client.get("/api/heroes/70")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["name"] == "Batman"
    assert data["powerstats"]["intelligence"] == "100"

    # persisted in DB
    stored = db.session.get(Hero, 70)
    assert stored is not None
    assert stored.name == "Batman"


def test_search_heroes(client, monkeypatch):
    def fake_get(url):
        class FakeResp:
            ok = True
            def json(self):
                return BATMAN_SEARCH
        return FakeResp()

    monkeypatch.setattr("backend.app.routes.heroes.requests.get", fake_get)

    resp = client.get("/api/heroes/search?q=batman")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["name"] == "Batman"
