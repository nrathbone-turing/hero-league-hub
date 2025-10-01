# File: backend/tests/test_routes_entrants.py
# Purpose: API route tests for Entrant resource (CRUD).
# Notes:
# - Uses helpers from conftest.py to create Events.
# - Covers create, read, update, and delete.
# - Includes soft-delete logic when entrant is in a match.

from backend.app.models import Entrant, Match
from backend.app.extensions import db
from sqlalchemy import select


def test_create_entrant(client, create_event, auth_header):
    event = create_event()
    response = client.post(
        "/api/entrants",
        json={"name": "Spiderman", "alias": "Webslinger", "event_id": event.id},
        headers=auth_header,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Spiderman"
    assert data["event_id"] == event.id


def test_get_entrants(client, create_event, session):
    event = create_event()
    entrant = Entrant(name="Batman", alias="Dark Knight", event_id=event.id)
    session.add(entrant)
    session.commit()

    response = client.get("/api/entrants")
    assert response.status_code == 200
    data = response.get_json()
    assert any(ent["name"] == "Batman" for ent in data)


def test_update_entrant(client, create_event, session, auth_header):
    event = create_event()
    entrant = Entrant(name="Temp Hero", alias="None", event_id=event.id)
    session.add(entrant)
    session.commit()

    response = client.put(
        f"/api/entrants/{entrant.id}", json={"alias": "Updated Alias"}, headers=auth_header
    )
    assert response.status_code == 200
    assert response.get_json()["alias"] == "Updated Alias"

    result = db.session.execute(select(Entrant).filter_by(id=entrant.id)).scalar_one()
    assert result.alias == "Updated Alias"


def test_delete_entrant_hard_delete_when_no_matches(client, create_event, session, auth_header):
    event = create_event()
    entrant = Entrant(name="Deleteable", alias="Temp", event_id=event.id)
    session.add(entrant)
    session.commit()

    response = client.delete(f"/api/entrants/{entrant.id}", headers=auth_header)
    assert response.status_code == 204
    assert db.session.get(Entrant, entrant.id) is None


def test_delete_entrant_soft_delete_when_in_match(client, seed_event_with_entrants, session, auth_header):
    event, e1, e2 = seed_event_with_entrants()
    match = Match(
        event_id=event.id,
        round=1,
        entrant1_id=e1.id,
        entrant2_id=e2.id,
        scores="1-0",
        winner_id=e1.id,
    )
    session.add(match)
    session.commit()

    response = client.delete(f"/api/entrants/{e1.id}", headers=auth_header)
    assert response.status_code == 200
    data = response.get_json()
    assert data["dropped"] is True
    assert data["name"] == "Dropped"

    updated = db.session.get(Entrant, e1.id)
    assert updated.dropped is True
    assert updated.name == "Dropped"
    assert db.session.get(Match, match.id).entrant1_id == e1.id


def test_create_entrant_requires_auth(client, create_event):
    event = create_event()
    resp = client.post("/api/entrants", json={"name": "Fail", "event_id": event.id})
    assert resp.status_code == 401
