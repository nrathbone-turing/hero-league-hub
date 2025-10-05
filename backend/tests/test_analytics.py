# File: backend/tests/test_analytics.py
# Purpose: Integration tests for /api/analytics endpoints.
# Notes:
# - Uses shared seeded data via `seed_full_db` (session scope).
# - Validates structure and content of analytics API responses.
# - Prints helpful debug output if responses are unexpectedly empty.

import pytest


@pytest.mark.analytics
def test_hero_analytics_endpoint(client, seed_full_db):
    """Ensure /api/analytics/heroes returns structured hero stats."""
    res = client.get("/api/analytics/heroes")
    assert res.status_code == 200, f"Unexpected status {res.status_code}"

    data = res.get_json()
    assert isinstance(data, dict), "Expected dict JSON structure"
    assert "heroes" in data, "Missing 'heroes' key in response"

    heroes = data["heroes"]
    assert isinstance(heroes, list), "Heroes must be a list"

    # Print helpful debug info if nothing returned
    if not heroes:
        print("⚠️  No heroes returned from analytics endpoint!")
        print(f"Full response: {data}")
    assert len(heroes) > 0, "Expected at least one hero result"

    # Validate structure of first hero
    sample = heroes[0]
    assert {"name", "usage_rate", "win_rate"} <= sample.keys()
    assert isinstance(sample["name"], str)
    assert isinstance(sample["usage_rate"], (int, float))
    assert isinstance(sample["win_rate"], (int, float))
    assert 0 <= sample["usage_rate"] <= 1
    assert 0 <= sample["win_rate"] <= 1


@pytest.mark.analytics
def test_event_participation_endpoint(client, seed_full_db):
    """Ensure /api/analytics/usage returns participation data per event."""
    res = client.get("/api/analytics/usage")
    assert res.status_code == 200, f"Unexpected status {res.status_code}"

    data = res.get_json()
    assert isinstance(data, dict)
    assert "participation" in data, "Missing 'participation' key"

    participation = data["participation"]
    assert isinstance(participation, list), "Expected list for participation"

    if not participation:
        print("⚠️  No event participation data returned!")
        print(f"Full response: {data}")
    assert len(participation) > 0, "Expected participation results"

    first = participation[0]
    assert {"event", "participants"} <= first.keys()
    assert isinstance(first["event"], str)
    assert isinstance(first["participants"], int)
    assert first["participants"] >= 0


@pytest.mark.analytics
def test_match_results_endpoint(client, seed_full_db):
    """Ensure /api/analytics/results returns match summaries per event."""
    res = client.get("/api/analytics/results")
    assert res.status_code == 200, f"Unexpected status {res.status_code}"

    data = res.get_json()
    assert isinstance(data, dict)
    assert "events" in data, "Missing 'events' key"

    events = data["events"]
    assert isinstance(events, list), "Expected list for events"

    if not events:
        print("⚠️  No match result data returned!")
        print(f"Full response: {data}")
    assert len(events) > 0, "Expected event results"

    first = events[0]
    assert {"name", "matches", "completed"} <= first.keys()
    assert isinstance(first["name"], str)
    assert isinstance(first["matches"], int)
    assert isinstance(first["completed"], int)
    assert first["matches"] >= 0
    assert first["completed"] >= 0
