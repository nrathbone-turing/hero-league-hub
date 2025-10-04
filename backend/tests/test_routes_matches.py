# File: backend/tests/test_routes_matches.py
# Purpose: Updated tests for Match routes after model refactor.
# Notes:
# - Adjusted to reflect new Match.to_dict(include_entrants=True) shape.
# - Validates create, read, update, delete, and invalid-winner behavior.
# - Ensures nested entrant and winner structures serialize correctly.

from backend.app.models import Match
from backend.app.extensions import db
from sqlalchemy import select


def test_create_match(client, seed_event_with_entrants, auth_user_and_header):
    """Authenticated user can create a match with valid entrants and winner."""
    _, auth_header = auth_user_and_header
    event, e1, e2 = seed_event_with_entrants()

    response = client.post(
        "/api/matches",
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

    assert response.status_code == 201, response.get_data(as_text=True)
    data = response.get_json()
    assert data["scores"] == "2-1"
    assert data["winner_id"] == e1.id
    assert data["entrant1"]["id"] == e1.id
    assert data["entrant2"]["id"] == e2.id
    assert data["winner"]["id"] == e1.id


def test_create_match_rejects_invalid_winner(
    client, seed_event_with_entrants, auth_user_and_header
):
    """Creating a match should reject invalid winner_id not in entrant1/2."""
    _, auth_header = auth_user_and_header
    event, e1, e2 = seed_event_with_entrants()

    resp = client.post(
        "/api/matches",
        json={
            "event_id": event.id,
            "round": 1,
            "entrant1_id": e1.id,
            "entrant2_id": e2.id,
            "scores": "2-1",
            "winner_id": 999,  # invalid
        },
        headers=auth_header,
    )

    assert resp.status_code == 400
    assert "winner" in resp.get_json()["error"].lower()


def test_get_matches(client, seed_event_with_entrants, session):
    """GET /api/matches should return serialized list including entrants."""
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

    response = client.get("/api/matches")
    assert response.status_code == 200, response.get_data(as_text=True)

    matches = response.get_json()
    assert isinstance(matches, list)
    assert any(m["scores"] == "1-0" for m in matches)

    sample = matches[0]
    assert "entrant1" in sample and "entrant2" in sample
    assert isinstance(sample["entrant1"], dict)
    assert "id" in sample["entrant1"]


def test_update_match(client, seed_event_with_entrants, session, auth_user_and_header):
    """PUT /api/matches/:id should update match scores successfully."""
    _, auth_header = auth_user_and_header
    event, e1, e2 = seed_event_with_entrants()

    match = Match(
        event_id=event.id, round=1, entrant1_id=e1.id, entrant2_id=e2.id, scores="0-0"
    )
    session.add(match)
    session.commit()

    response = client.put(
        f"/api/matches/{match.id}", json={"scores": "2-0"}, headers=auth_header
    )
    assert response.status_code == 200, response.get_data(as_text=True)

    updated = response.get_json()
    assert updated["scores"] == "2-0"

    db_match = db.session.execute(select(Match).filter_by(id=match.id)).scalar_one()
    assert db_match.scores == "2-0"


def test_delete_match(client, seed_event_with_entrants, session, auth_user_and_header):
    """DELETE /api/matches/:id should delete match record."""
    _, auth_header = auth_user_and_header
    event, e1, e2 = seed_event_with_entrants()

    match = Match(
        event_id=event.id, round=1, entrant1_id=e1.id, entrant2_id=e2.id, scores="1-1"
    )
    session.add(match)
    session.commit()

    response = client.delete(f"/api/matches/{match.id}", headers=auth_header)
    assert response.status_code == 204, response.get_data(as_text=True)
    assert db.session.get(Match, match.id) is None


def test_create_match_requires_auth(client, seed_event_with_entrants):
    """Unauthenticated users cannot create a match."""
    event, e1, e2 = seed_event_with_entrants()

    resp = client.post(
        "/api/matches",
        json={
            "event_id": event.id,
            "round": 1,
            "entrant1_id": e1.id,
            "entrant2_id": e2.id,
            "scores": "1-1",
        },
    )
    assert resp.status_code == 401
