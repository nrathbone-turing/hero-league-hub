# File: backend/tests/test_analytics.py
# Purpose: Integration tests for /api/analytics endpoints.
# Notes:
# - Validates schema and data structure only (not specific values).
# - Ensures API routes respond with 200 and contain expected fields.

import pytest


@pytest.mark.analytics
def test_get_hero_analytics(client):
    """Check hero analytics structure and value types."""
    res = client.get("/api/analytics/heroes")
    assert res.status_code == 200

    data = res.get_json()
    assert "heroes" in data
    assert isinstance(data["heroes"], list)
    assert len(data["heroes"]) > 0

    for hero in data["heroes"]:
        assert set(hero.keys()) == {"name", "usage_rate", "win_rate"}
        assert isinstance(hero["name"], str)
        assert isinstance(hero["usage_rate"], (int, float))
        assert 0 <= hero["usage_rate"] <= 1
        assert isinstance(hero["win_rate"], (int, float))
        assert 0 <= hero["win_rate"] <= 1


@pytest.mark.analytics
def test_get_event_participation(client):
    """Check event participation analytics structure."""
    res = client.get("/api/analytics/usage")
    assert res.status_code == 200

    data = res.get_json()
    assert "participation" in data
    participation = data["participation"]
    assert isinstance(participation, list)
    assert len(participation) > 0

    for event in participation:
        assert set(event.keys()) == {"event", "participants"}
        assert isinstance(event["event"], str)
        assert isinstance(event["participants"], int)
        assert event["participants"] >= 0


@pytest.mark.analytics
def test_get_match_results_summary(client):
    """Check match results analytics structure."""
    res = client.get("/api/analytics/results")
    assert res.status_code == 200

    data = res.get_json()
    assert "events" in data
    events = data["events"]
    assert isinstance(events, list)
    assert len(events) > 0

    for e in events:
        assert set(e.keys()) == {"name", "matches", "completed"}
        assert isinstance(e["name"], str)
        assert isinstance(e["matches"], int)
        assert e["matches"] >= 0
        assert isinstance(e["completed"], int)
        assert e["completed"] >= 0
