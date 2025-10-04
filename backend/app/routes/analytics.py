# File: backend/app/routes/analytics.py
# Purpose: Provides aggregated analytics data for heroes, matches, and events.
# Notes:
# - Backed by real SQL aggregation functions in analytics_utils.py.
# - Returns summarized metrics for frontend dashboards and charts.
# - Includes structured error handling and consistent JSON responses.

from flask import Blueprint, jsonify
from backend.app.models.analytics_utils import (
    get_hero_win_rates,
    get_event_participation,
    get_match_results_summary,
)
import traceback

bp = Blueprint("analytics", __name__)


# ------------------------
# HERO ANALYTICS
# ------------------------
@bp.route("/heroes", methods=["GET"])
def hero_analytics():
    """Returns hero usage and win rate statistics.
    - Aggregates Entrant ↔ Hero ↔ Match data.
    - Used for hero usage pie chart and win rate bar chart.
    """
    try:
        heroes = get_hero_win_rates()
        return jsonify({"heroes": heroes}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=f"Failed to retrieve hero analytics: {str(e)}"), 500


# ------------------------
# MATCH / EVENT RESULTS
# ------------------------
@bp.route("/results", methods=["GET"])
def match_results():
    """Returns event-level match summary data.
    - Includes total matches and number of completed matches per event.
    - Used for win/loss summaries in analytics dashboard.
    """
    try:
        events = get_match_results_summary()
        return jsonify({"events": events}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=f"Failed to retrieve match results: {str(e)}"), 500


# ------------------------
# EVENT PARTICIPATION
# ------------------------
@bp.route("/usage", methods=["GET"])
def event_usage():
    """Returns participant counts grouped by event.
    - Useful for measuring engagement across events.
    - Displayed in frontend participation charts.
    """
    try:
        participation = get_event_participation()
        return jsonify({"participation": participation}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=f"Failed to retrieve event participation: {str(e)}"), 500


# ------------------------
# ROUTE HEALTH / INDEX
# ------------------------
@bp.route("/", methods=["GET"])
def analytics_root():
    """Route index for analytics blueprint.
    - Provides a quick health check and route listing.
    """
    try:
        return (
            jsonify(
                {
                    "status": "ok",
                    "available_routes": [
                        "/api/analytics/heroes",
                        "/api/analytics/results",
                        "/api/analytics/usage",
                    ],
                }
            ),
            200,
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=f"Failed to load analytics root: {str(e)}"), 500
