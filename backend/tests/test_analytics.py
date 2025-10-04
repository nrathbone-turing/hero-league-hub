# File: backend/tests/test_analytics.py
# Purpose: Integration tests for /api/analytics endpoints.
# Notes:
# - Seeds the test database using backend/scripts/seed_db.py
# - Validates response schema and field types for analytics endpoints.
# - Ensures each route returns non-empty, correctly structured data.

import pytest
from flask import json


@pytest.mark.analytics
def test_get_hero_analytics(client, seed_full_db):
    """Check hero analytics structure and value types."""
    res = client.get("/api/analytics/heroes")
    assert res.status_code == 200, f"Unexpected status code: {res.status_code}"

    data = res.get_json()
    assert data is not None, "Response JSON is None"
    assert "heroes" in data
    assert isinstance(data["heroes"], list)
    assert len(data["heroes"]) > 0, "No hero data returned"

    for hero in data["heroes"]:
        assert set(hero.keys()) == {"name", "usage_rate", "win_rate"}
        assert isinstance(hero["name"], str)
        assert isinstance(hero["usage_rate"], (int, float))
        assert 0 <= hero["usage_rate"] <= 1
        assert isinstance(hero["win_rate"], (int, float))
        assert 0 <= hero["win_rate"] <= 1


@pytest.mark.analytics
def test_get_event_participation(client, seed_full_db):
    """Check event participation analytics structure."""
    res = client.get("/api/analytics/usage")
    assert res.status_code == 200, f"Unexpected status code: {res.status_code}"

    data = res.get_json()
    assert data is not None
    assert "participation" in data
    participation = data["participation"]
    assert isinstance(participation, list)
    assert len(participation) > 0, "No participation data returned"

    for event in participation:
        assert set(event.keys()) == {"event", "participants"}
        assert isinstance(event["event"], str)
        assert isinstance(event["participants"], int)
        assert event["participants"] >= 0


@pytest.mark.analytics
def test_get_match_results_summary(client, seed_full_db):
    """Check match results analytics structure."""
    res = client.get("/api/analytics/results")
    assert res.status_code == 200, f"Unexpected status code: {res.status_code}"

    data = res.get_json()
    assert data is not None
    assert "events" in data
    events = data["events"]
    assert isinstance(events, list)
    assert len(events) > 0, "No match results data returned"

    for e in events:
        assert set(e.keys()) == {"name", "matches", "completed"}
        assert isinstance(e["name"], str)
        assert isinstance(e["matches"], int)
        assert e["matches"] >= 0
        assert isinstance(e["completed"], int)
        assert e["completed"] >= 0
