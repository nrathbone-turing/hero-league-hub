# backend/app/routes/matches.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from backend.app.models.models import Match
from backend.app.extensions import db
import traceback

bp = Blueprint("matches", __name__, url_prefix="/matches")


@bp.route("", methods=["POST"])
@jwt_required()
def create_match():
    data = request.get_json() or {}
    print("DEBUG create_match payload:", data)

    try:
        event_id = int(data.get("event_id"))
        entrant1_id = int(data.get("entrant1_id"))
        entrant2_id = int(data.get("entrant2_id"))
        round_num = int(data.get("round")) if data.get("round") else None
        winner_id = int(data["winner_id"]) if data.get("winner_id") else None

        if winner_id and winner_id not in (entrant1_id, entrant2_id):
            return jsonify(error="Winner ID must match one of the entrants"), 400

        match = Match(
            event_id=event_id,
            round=round_num,
            entrant1_id=entrant1_id,
            entrant2_id=entrant2_id,
            scores=data.get("scores"),
            winner_id=winner_id,
        )
        db.session.add(match)
        db.session.commit()

        print(f"✅ Created match {match.id} for event {event_id}")
        return jsonify(match.to_dict(include_names=True)), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error creating match: {e}")
        return jsonify(error="Failed to create match"), 500


@bp.route("", methods=["GET"])
def get_matches():
    try:
        event_id = request.args.get("event_id", type=int)
        query = Match.query
        if event_id:
            query = query.filter_by(event_id=event_id)
        matches = query.all()
        return jsonify([m.to_dict(include_names=True) for m in matches]), 200
    except Exception as e:
        traceback.print_exc()
        print(f"❌ Error fetching matches: {e}")
        return jsonify(error="Failed to fetch matches"), 500


@bp.route("/<int:match_id>", methods=["PUT"])
@jwt_required()
def update_match(match_id):
    try:
        match = Match.query.get_or_404(match_id)
        data = request.get_json() or {}
        for key, value in data.items():
            setattr(match, key, value)
        db.session.commit()
        print(f"✅ Updated match {match_id}")
        return jsonify(match.to_dict(include_names=True)), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error updating match {match_id}: {e}")
        return jsonify(error="Failed to update match"), 500


@bp.route("/<int:match_id>", methods=["DELETE"])
@jwt_required()
def delete_match(match_id):
    try:
        match = Match.query.get_or_404(match_id)
        db.session.delete(match)
        db.session.commit()
        print(f"✅ Deleted match {match_id}")
        return "", 204
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error deleting match {match_id}: {e}")
        return jsonify(error="Failed to delete match"), 500
