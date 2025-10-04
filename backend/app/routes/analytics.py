# File: backend/app/routes/analytics.py
# Purpose: Provides analytics data for events, matches, and heroes.
# Notes:
# - Currently returns mock data for demo/dev.
# - To be replaced with real SQL queries for aggregated insights.

from flask import Blueprint, jsonify

bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@bp.route("/heroes", methods=["GET"])
def hero_analytics():
    """Returns mock hero win rates and usage stats."""
    data = {
        "heroes": [
            {"name": "Superman", "usage_rate": 0.20, "win_rate": 0.75},
            {"name": "Batman", "usage_rate": 0.15, "win_rate": 0.68},
            {"name": "Wonder Woman", "usage_rate": 0.10, "win_rate": 0.60},
            {"name": "Spiderman", "usage_rate": 0.08, "win_rate": 0.54},
        ]
    }
    return jsonify(data), 200


@bp.route("/results", methods=["GET"])
def match_results():
    """Returns event-level aggregated win/loss summaries."""
    data = {
        "events": [
            {"name": "Hero Cup", "matches": 12, "avg_score": "2-1"},
            {"name": "Villain Showdown", "matches": 10, "avg_score": "2-0"},
        ]
    }
    return jsonify(data), 200


@bp.route("/usage", methods=["GET"])
def event_usage():
    """Returns participation statistics by event."""
    data = {
        "participation": [
            {"event": "Hero Cup", "participants": 16},
            {"event": "Villain Showdown", "participants": 12},
            {"event": "Battle Royale", "participants": 20},
        ]
    }
    return jsonify(data), 200
