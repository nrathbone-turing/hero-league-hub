# File: backend/tests/test_analytics.py
# Purpose: Verifies mock analytics routes return 200 and expected keys.

def test_get_hero_analytics(client):
    res = client.get("/api/analytics/heroes")
    assert res.status_code == 200
    data = res.get_json()
    assert "heroes" in data
    assert all("name" in h for h in data["heroes"])


def test_get_match_results(client):
    res = client.get("/api/analytics/results")
    assert res.status_code == 200
    data = res.get_json()
    assert "events" in data


def test_get_event_usage(client):
    res = client.get("/api/analytics/usage")
    assert res.status_code == 200
    data = res.get_json()
    assert "participation" in data
