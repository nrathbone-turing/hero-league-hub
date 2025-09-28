# backend/app/routes/entrants.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.models import Entrant
from app.extensions import db
import traceback

bp = Blueprint("entrants", __name__, url_prefix="/entrants")


@bp.route("", methods=["POST"])
@jwt_required()
def create_entrant():
    """Create a new Entrant."""
    data = request.get_json() or {}
    print("DEBUG create_entrant payload:", data)

    try:
        name = data.get("name")
        event_id = data.get("event_id")
        if not name or not event_id:
            return jsonify(error="Name and event_id are required"), 400

        entrant = Entrant(
            name=name,
            alias=data.get("alias"),
            event_id=int(event_id),
            dropped=bool(data.get("dropped", False)),
        )
        db.session.add(entrant)
        db.session.commit()

        print(f"✅ Created entrant {entrant.id} for event {event_id}")
        return jsonify(entrant.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error creating entrant: {e}")
        return jsonify(error="Failed to create entrant"), 500


@bp.route("", methods=["GET"])
def get_entrants():
    """Retrieve all Entrants (optionally filter by event_id)."""
    try:
        event_id = request.args.get("event_id", type=int)
        query = Entrant.query
        if event_id:
            query = query.filter_by(event_id=event_id)
        entrants = query.all()
        return jsonify([e.to_dict() for e in entrants]), 200
    except Exception as e:
        traceback.print_exc()
        print(f"❌ Error fetching entrants: {e}")
        return jsonify(error="Failed to fetch entrants"), 500


@bp.route("/<int:entrant_id>", methods=["PUT"])
@jwt_required()
def update_entrant(entrant_id):
    """Update an Entrant by ID."""
    try:
        entrant = Entrant.query.get_or_404(entrant_id)
        data = request.get_json() or {}
        for key, value in data.items():
            setattr(entrant, key, value)
        db.session.commit()
        print(f"✅ Updated entrant {entrant_id}")
        return jsonify(entrant.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error updating entrant {entrant_id}: {e}")
        return jsonify(error="Failed to update entrant"), 500


@bp.route("/<int:entrant_id>", methods=["DELETE"])
@jwt_required()
def delete_entrant(entrant_id):
    """Delete an Entrant by ID.
    - Hard delete if not referenced in matches
    - Soft delete (mark dropped) if referenced in matches
    """
    try:
        entrant = Entrant.query.get_or_404(entrant_id)
        from app.models import Match  # avoid circular import

        has_matches = (
            Match.query.filter(
                (Match.entrant1_id == entrant_id)
                | (Match.entrant2_id == entrant_id)
                | (Match.winner_id == entrant_id)
            ).count()
            > 0
        )

        if has_matches:
            entrant.soft_delete()
            db.session.commit()
            print(f"⚠️ Entrant {entrant_id} marked as dropped (still in matches)")
            return jsonify(entrant.to_dict()), 200
        else:
            db.session.delete(entrant)
            db.session.commit()
            print(f"✅ Entrant {entrant_id} fully deleted (no matches)")
            return "", 204
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error deleting entrant {entrant_id}: {e}")
        return jsonify(error="Failed to delete entrant"), 500
