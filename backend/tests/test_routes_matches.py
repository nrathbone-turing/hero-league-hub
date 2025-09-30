# File: backend/tests/test_routes_matches.py
# Purpose: API route tests for Match resource (CRUD).
# Notes:
# - Uses helper fixture seed_event_with_entrants from conftest.py.
# - Covers create, read, update, and delete for Match.
# - Includes validation for winner_id correctness.

from backend.app.models import Match
from backend.app.extensions import db
from sqlalchemy import select


def test_create_match(client, seed_event_with_entrants, auth_header):
    event, e1, e2 = seed_event_with_entrants()
    response = client.post(
        "/matches",
        json={
            "event_id": event.id,
            "round": 1,
            "entrant1_id": e1.id,
            "entrant2_id": e2.id,
            "scores": "2-1",
            "winner_id": e1.id,
        },
        headers=auth_header,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["winner_id"] == e1.id


def test_create_match_rejects_invalid_winner(client, seed_event_with_entrants, auth_header):
    event, e1, e2 = seed_event_with_entrants()
    resp = client.post(
        "/matches",
        json={
            "event_id": event.id,
            "round": 1,
            "entrant1_id": e1.id,
            "entrant2_id": e2.id,
            "scores": "2-1",
            "winner_id": 999,  # not one of the entrants
        },
        headers=auth_header,
    )
    assert resp.status_code == 400
    assert "winner id must match" in resp.get_json()["error"].lower()


def test_get_matches(client, seed_event_with_entrants, session):
    event, e1, e2 = seed_event_with_entrants()
    match = Match(event_id=event.id, round=1, entrant1_id=e1.id, entrant2_id=e2.id, scores="1-0", winner_id=e1.id)
    session.add(match)
    session.commit()

    response = client.get("/matches")
    assert response.status_code == 200
    matches = response.get_json()
    assert any(m["scores"] == "1-0" for m in matches)


def test_update_match(client, seed_event_with_entrants, session, auth_header):
    event, e1, e2 = seed_event_with_entrants()
    match = Match(event_id=event.id, round=1, entrant1_id=e1.id, entrant2_id=e2.id, scores="0-0")
    session.add(match)
    session.commit()

    response = client.put(f"/matches/{match.id}", json={"scores": "2-0"}, headers=auth_header)
    assert response.status_code == 200
    assert response.get_json()["scores"] == "2-0"

    result = db.session.execute(select(Match).filter_by(id=match.id)).scalar_one()
    assert result.scores == "2-0"


def test_delete_match(client, seed_event_with_entrants, session, auth_header):
    event, e1, e2 = seed_event_with_entrants()
    match = Match(event_id=event.id, round=1, entrant1_id=e1.id, entrant2_id=e2.id, scores="1-1")
    session.add(match)
    session.commit()

    response = client.delete(f"/matches/{match.id}", headers=auth_header)
    assert response.status_code == 204
    assert db.session.get(Match, match.id) is None


def test_create_match_requires_auth(client, seed_event_with_entrants):
    event, e1, e2 = seed_event_with_entrants()
    resp = client.post(
        "/matches",
        json={
            "event_id": event.id,
            "round": 1,
            "entrant1_id": e1.id,
            "entrant2_id": e2.id,
            "scores": "1-1",
        },
    )
    assert resp.status_code == 401
