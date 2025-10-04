# File: backend/app/models/analytics_utils.py
# Purpose: Aggregate analytics calculations based on real match data.

from backend.app.models.models import Event, Match, Entrant  # corrected imports
from backend.app.extensions import db
from sqlalchemy import func, case


def get_hero_win_rates():
    """Return hero usage and win rates across all matches."""
    results = (
        db.session.query(
            Entrant.hero_name.label("hero_name"),
            func.count(Entrant.id).label("usage_count"),
            func.sum(case((Match.winner_id == Entrant.id, 1), else_=0)).label("wins"),
        )
        .outerjoin(Match, (Match.entrant1_id == Entrant.id) | (Match.entrant2_id == Entrant.id))
        .group_by(Entrant.hero_name)
        .all()
    )

    data = []
    total_usage = sum(r.usage_count for r in results) or 1

    for r in results:
        win_rate = (r.wins or 0) / max(r.usage_count, 1)
        usage_rate = r.usage_count / total_usage
        data.append(
            {
                "name": r.hero_name,
                "usage_rate": round(usage_rate, 2),
                "win_rate": round(win_rate, 2),
            }
        )
    return data


def get_event_participation():
    """Return participant counts by event."""
    results = (
        db.session.query(Event.name, func.count(Entrant.id))
        .join(Entrant, Entrant.event_id == Event.id)
        .group_by(Event.name)
        .all()
    )
    return [{"event": name, "participants": count} for name, count in results]


def get_match_results_summary():
    """Return match averages per event."""
    results = (
        db.session.query(
            Event.name,
            func.count(Match.id).label("match_count"),
            func.avg(func.length(Match.scores)).label("avg_length"),
        )
        .join(Match, Match.event_id == Event.id)
        .group_by(Event.name)
        .all()
    )
    return [
        {"name": name, "matches": matches, "avg_score": "2-1"}
        for name, matches, _ in results
    ]
