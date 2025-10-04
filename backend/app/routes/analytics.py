# File: backend/app/routes/analytics.py
# Purpose: Provides analytics data for events, matches, and heroes.
# Notes:
# - Currently returns mock data for demo/dev.
# - To be replaced with real SQL queries for aggregated insights.

from flask import Blueprint, jsonify
from backend.app.models.analytics_utils import (
    get_hero_win_rates,
    get_event_participation,
    get_match_results_summary,
)

bp = Blueprint("analytics", __name__)


@bp.route("/heroes", methods=["GET"])
def hero_analytics():
    """Returns hero win rates and usage stats."""
    
    return jsonify({"heroes": get_hero_win_rates()}), 200


@bp.route("/results", methods=["GET"])
def match_results():
    """Returns event-level aggregated win/loss summaries."""
    
    return jsonify({"events": get_match_results_summary()}), 200


@bp.route("/usage", methods=["GET"])
def event_usage():
    """Returns participation statistics by event."""
    
    return jsonify({"participation": get_event_participation()}), 200
