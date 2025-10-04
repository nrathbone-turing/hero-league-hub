# File: backend/tests/test_routes_entrants.py
# Purpose: API route tests for Entrant resource (CRUD + user registration).
# Notes:
# - Covers admin CRUD (P2).
# - Covers user registration and duplicate prevention (P3).

from backend.app.models import Entrant, Match
from backend.app.extensions import db
from sqlalchemy import select


def test_user_registers_for_event(client, create_event, create_hero, auth_user_and_header):
    """Authenticated user can register for an event with a hero."""
    user, auth_header = auth_user_and_header
    event = create_event()
    hero = create_hero()

    resp = client.post(
        "/api/entrants/register",
        json={"user_id": user.id, "event_id": event.id, "hero_id": hero.id},
        headers=auth_header,
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["event_id"] == event.id
    assert data["user_id"] == user.id
    assert data["hero_id"] == hero.id


def test_prevent_duplicate_registration(client, create_event, create_hero, auth_user_and_header):
    """Duplicate entrant registration for same user/event/hero is blocked."""
    user, auth_header = auth_user_and_header
    event = create_event()
    hero = create_hero()

    payload = {"user_id": user.id, "event_id": event.id, "hero_id": hero.id}
    resp1 = client.post("/api/entrants/register", json=payload, headers=auth_header)
    assert resp1.status_code == 201

    resp2 = client.post("/api/entrants/register", json=payload, headers=auth_header)
    assert resp2.status_code == 400
    assert "already registered" in resp2.get_json()["error"].lower()


def test_create_entrant_admin(client, create_event, auth_user_and_header):
    """Admin-level creation of an entrant by POST /api/entrants."""
    _, auth_header = auth_user_and_header
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


def test_get_entrants_filter_by_event_and_user(client, create_event, create_hero, auth_user_and_header):
    """Filter entrants by event_id and user_id query params."""
    user, auth_header = auth_user_and_header
    event = create_event()
    hero = create_hero()

    # Register entrant
    client.post(
        "/api/entrants/register",
        json={"user_id": user.id, "event_id": event.id, "hero_id": hero.id},
        headers=auth_header,
    )

    resp = client.get(f"/api/entrants?event_id={event.id}&user_id={user.id}", headers=auth_header)
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["user_id"] == user.id


def test_update_entrant(client, create_event, session, auth_user_and_header):
    """PUT /api/entrants/:id updates entrant alias."""
    _, auth_header = auth_user_and_header
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


def test_delete_entrant_hard_and_soft(client, seed_event_with_entrants, session, auth_user_and_header):
    """DELETE /api/entrants/:id supports soft-delete (in matches) and hard-delete."""
    _, auth_header = auth_user_and_header
    event, e1, e2 = seed_event_with_entrants()
    match = Match(
        event_id=event.id, round=1, entrant1_id=e1.id, entrant2_id=e2.id, scores="1-0", winner_id=e1.id
    )
    session.add(match)
    session.commit()

    # Soft delete
    response = client.delete(f"/api/entrants/{e1.id}", headers=auth_header)
    assert response.status_code == 200
    assert response.get_json()["dropped"] is True

    # Hard delete
    e3 = Entrant(name="DeleteMe", alias="Test", event_id=event.id)
    session.add(e3)
    session.commit()
    resp2 = client.delete(f"/api/entrants/{e3.id}", headers=auth_header)
    assert resp2.status_code == 204
    assert db.session.get(Entrant, e3.id) is None
