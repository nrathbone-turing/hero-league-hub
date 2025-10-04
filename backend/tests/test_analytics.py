# File: backend/tests/test_analytics.py
# Purpose: Integration tests for analytics endpoints.
# Notes:
# - Validates structure, field presence, and data types.
# - Does not rely on seeded counts, only schema correctness.

import pytest

@pytest.mark.analytics
def test_get_hero_analytics(client):
    res = client.get("/api/analytics/heroes")
    assert res.status_code == 200

    data = res.get_json()
    assert isinstance(data, dict)
    assert "heroes" in data
    heroes = data["heroes"]
    assert isinstance(heroes, list)

    for hero in heroes:
        assert "name" in hero
        assert isinstance(hero["name"], str)
        assert "usage_rate" in hero
        assert isinstance(hero["usage_rate"], (int, float))
        assert 0 <= hero["usage_rate"] <= 1
        assert "win_rate" in hero
        assert isinstance(hero["win_rate"], (int, float))
        assert 0 <= hero["win_rate"] <= 1


@pytest.mark.analytics
def test_get_event_participation(client):
    res = client.get("/api/analytics/usage")
    assert res.status_code == 200

    data = res.get_json()
    assert "participation" in data
    participation = data["participation"]
    assert isinstance(participation, list)

    for event in participation:
        assert "event" in event
        assert isinstance(event["event"], str)
        assert "participants" in event
        assert isinstance(event["participants"], int)
        assert event["participants"] >= 0


@pytest.mark.analytics
def test_get_match_results_summary(client):
    res = client.get("/api/analytics/results")
    assert res.status_code == 200

    data = res.get_json()
    assert "events" in data
    events = data["events"]
    assert isinstance(events, list)

    for e in events:
        assert "name" in e
        assert isinstance(e["name"], str)
        assert "matches" in e
        assert isinstance(e["matches"], int)
        assert e["matches"] >= 0
        assert "completed" in e
        assert isinstance(e["completed"], int)
        assert e["completed"] >= 0
