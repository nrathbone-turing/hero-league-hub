# File: backend/app/routes/matches.py
# Purpose: Match CRUD routes for events.
# Notes:
# - Updated to use Match.to_dict() without deprecated include_names param.
# - Automatically includes entrant1, entrant2, and winner serialization.
# - Validates winner_id must match entrant1_id or entrant2_id if provided.

from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import jwt_required
from backend.app.models.models import Match, Entrant
from backend.app.extensions import db
import traceback

bp = Blueprint("matches", __name__)


@bp.route("", methods=["POST"])
@jwt_required()
def create_match():
    """Create a new match between two entrants."""
    data = request.get_json() or {}
    try:
        event_id = data.get("event_id")
        entrant1_id = data.get("entrant1_id")
        entrant2_id = data.get("entrant2_id")
        scores = data.get("scores")
        winner_id = data.get("winner_id")
        round_num = data.get("round")

        if not event_id or not entrant1_id or not entrant2_id:
            return jsonify(error="event_id, entrant1_id, and entrant2_id are required"), 400

        if winner_id and winner_id not in [entrant1_id, entrant2_id]:
            return jsonify(error="Winner id must match one of the entrants"), 400

        match = Match(
            event_id=event_id,
            entrant1_id=entrant1_id,
            entrant2_id=entrant2_id,
            scores=scores,
            winner_id=winner_id,
            round=round_num,
        )

        db.session.add(match)
        db.session.commit()
        print(f"✅ Created match {match.id} for event {event_id}")

        # manually embed entrant + winner objects
        return jsonify(_match_with_relations(match)), 201

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error creating match: {e}")
        return jsonify(error="Failed to create match"), 500


@bp.route("", methods=["GET"])
@jwt_required(optional=True)
def get_matches():
    """Return all matches."""
    try:
        matches = Match.query.all()
        return jsonify([_match_with_relations(m) for m in matches]), 200
    except Exception as e:
        traceback.print_exc()
        print(f"❌ Error fetching matches: {e}")
        return jsonify(error="Failed to fetch matches"), 500


@bp.route("/<int:match_id>", methods=["PUT"])
@jwt_required()
def update_match(match_id):
    """Update an existing match."""
    try:
        match = db.session.get(Match, match_id)
        if not match:
            abort(404)

        data = request.get_json() or {}
        for key, value in data.items():
            if hasattr(match, key):
                setattr(match, key, value)

        db.session.commit()
        print(f"✅ Updated match {match.id}")
        return jsonify(_match_with_relations(match)), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error updating match {match_id}: {e}")
        return jsonify(error="Failed to update match"), 500


@bp.route("/<int:match_id>", methods=["DELETE"])
@jwt_required()
def delete_match(match_id):
    """Delete a match by ID."""
    try:
        match = db.session.get(Match, match_id)
        if not match:
            abort(404)

        db.session.delete(match)
        db.session.commit()
        print(f"🗑 Deleted match {match_id}")
        return "", 204
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error deleting match {match_id}: {e}")
        return jsonify(error="Failed to delete match"), 500


# ------------------------
# Helper
# ------------------------
def _match_with_relations(match: Match):
    """Embed entrant1, entrant2, and winner objects in match dict."""
    data = match.to_dict()
    e1 = db.session.get(Entrant, match.entrant1_id) if match.entrant1_id else None
    e2 = db.session.get(Entrant, match.entrant2_id) if match.entrant2_id else None
    w = db.session.get(Entrant, match.winner_id) if match.winner_id else None

    data["entrant1"] = e1.to_dict(include_user=True, include_hero=True) if e1 else None
    data["entrant2"] = e2.to_dict(include_user=True, include_hero=True) if e2 else None
    data["winner"] = w.to_dict(include_user=True, include_hero=True) if w else None
    return data
