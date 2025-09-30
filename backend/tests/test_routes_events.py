# File: backend/tests/test_routes_events.py
# Purpose: API route tests for Event resource (CRUD).
# Notes:
# - Uses Flask test client fixture (`client`) and helpers from conftest.py.
# - Covers create, read (with entrant counts), update, and delete.
# - Adds regression test for multi-level ordering: date desc → status priority → name asc.

from backend.app.models import Event, Entrant
from backend.app.extensions import db
from sqlalchemy import select


def test_create_event(client, auth_header):
    response = client.post(
        "/events",
        json={
            "name": "Hero Cup",
            "date": "2025-09-12",
            "rules": "Bo3",
            "status": "drafting",
        },
        headers=auth_header,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["status"] == "drafting"
    assert "id" in data


def test_get_events_with_counts(client, create_event, session):
    event = create_event(name="Seed Event", status="published")
    e1 = Entrant(name="Alpha", alias="A", event_id=event.id)
    e2 = Entrant(name="Beta", alias="B", event_id=event.id)
    session.add_all([e1, e2])
    session.commit()

    response = client.get("/events")
    assert response.status_code == 200
    data = response.get_json()
    seed_event = next(ev for ev in data if ev["name"] == "Seed Event")
    assert seed_event["entrant_count"] == 2


def test_update_event(client, create_event, auth_header):
    event = create_event(status="drafting")
    response = client.put(
        f"/events/{event.id}", json={"status": "cancelled"}, headers=auth_header
    )
    assert response.status_code == 200
    assert response.get_json()["status"] == "cancelled"

    result = db.session.execute(select(Event).filter_by(id=event.id)).scalar_one()
    assert result.status == "cancelled"


def test_delete_event(client, create_event, auth_header):
    event = create_event(status="drafting")
    response = client.delete(f"/events/{event.id}", headers=auth_header)
    assert response.status_code == 204
    assert (
        db.session.execute(select(Event).filter_by(id=event.id)).scalar_one_or_none()
        is None
    )


def test_create_event_requires_auth(client):
    resp = client.post(
        "/events",
        json={
            "name": "Fail Cup",
            "date": "2025-09-21",
            "rules": "Bo3",
            "status": "drafting",
        },
    )
    assert resp.status_code == 401


def test_get_events_sort_order(client, session):
    # Status order priority mapping: published > drafting > completed > cancelled
    e1 = Event(name="Alpha", date="2025-09-10", status="drafting")   # older date
    e2 = Event(name="Beta", date="2025-09-12", status="published")  # newer, high status
    e3 = Event(name="Gamma", date="2025-09-12", status="completed") # same date, lower
    e4 = Event(name="Delta", date="2025-09-12", status="drafting")  # same date
    e5 = Event(name="Zeta", date="2025-09-12", status="drafting")   # tie → name asc

    session.add_all([e1, e2, e3, e4, e5])
    session.commit()

    resp = client.get("/events")
    assert resp.status_code == 200
    events = resp.get_json()
    names = [e["name"] for e in events]

    assert names == ["Beta", "Delta", "Zeta", "Gamma", "Alpha"]
