# File: backend/app/models/analytics_utils.py
# Purpose: Aggregate analytics calculations for heroes, matches, and participation.
# Notes:
# - Joins Entrant → Hero safely, supports entrants without a hero.
# - Provides fallback labels for missing relationships.
# - Designed for both demo seed data and live environments.

from backend.app.models.models import Event, Match, Entrant, Hero
from backend.app.extensions import db
from sqlalchemy import func, case


def get_hero_win_rates():
    """Return hero usage and win rates across all matches."""
    results = (
        db.session.query(
            func.coalesce(Hero.name, "Unknown Hero").label("hero_name"),
            func.count(Entrant.id).label("usage_count"),
            func.sum(
                case((Match.winner_id == Entrant.id, 1), else_=0)
            ).label("wins"),
        )
        .select_from(Entrant)
        .outerjoin(Hero, Entrant.hero_id == Hero.id)
        .outerjoin(
            Match,
            (Match.entrant1_id == Entrant.id) | (Match.entrant2_id == Entrant.id),
        )
        .group_by(func.coalesce(Hero.name, "Unknown Hero"))
        .all()
    )

    total_usage = sum(r.usage_count for r in results) or 1
    heroes = []

    for r in results:
        win_rate = (r.wins or 0) / max(r.usage_count, 1)
        usage_rate = r.usage_count / total_usage
        heroes.append(
            {
                "name": r.hero_name,
                "usage_rate": round(usage_rate, 2),
                "win_rate": round(win_rate, 2),
            }
        )
    return heroes


def get_event_participation():
    """Return participant counts by event."""
    results = (
        db.session.query(
            Event.name.label("event_name"),
            func.count(Entrant.id).label("participants"),
        )
        .outerjoin(Entrant, Entrant.event_id == Event.id)
        .group_by(Event.name)
        .all()
    )

    return [
        {"event": name or "Unnamed Event", "participants": count or 0}
        for name, count in results
    ]


def get_match_results_summary():
    """Return aggregated match result summaries per event."""
    results = (
        db.session.query(
            Event.name.label("event_name"),
            func.count(Match.id).label("total_matches"),
            func.count(Match.winner_id).label("completed_matches"),
        )
        .outerjoin(Match, Match.event_id == Event.id)
        .group_by(Event.name)
        .all()
    )

    return [
        {
            "name": name or "Unnamed Event",
            "matches": total or 0,
            "completed": completed or 0,
        }
        for name, total, completed in results
    ]
