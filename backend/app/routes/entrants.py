# File: backend/app/routes/entrants.py
# Purpose: Entrant management (admin CRUD) + user registration for events.
# Notes:
# - Admins: can create/update/delete entrants freely.
# - Users: register themselves + hero into an event (one entrant per user/event).
# - Expanded GET supports filtering by event_id and user_id.

from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import jwt_required
from backend.app.models.models import Entrant, Match, Hero
from backend.app.extensions import db
import traceback

bp = Blueprint("entrants", __name__, url_prefix="/entrants")


# ------------------------
# USER-FACING REGISTRATION
# ------------------------
@bp.route("/register", methods=["POST"])
@jwt_required()
def register_user_for_event():
    """User registers themselves + hero for an event."""
    data = request.get_json() or {}
    try:
        user_id = data.get("user_id")
        event_id = data.get("event_id")
        hero_id = data.get("hero_id")

        if not user_id or not event_id or not hero_id:
            return jsonify(error="user_id, event_id, and hero_id are required"), 400

        # Prevent duplicate registration
        existing = Entrant.query.filter_by(user_id=user_id, event_id=event_id).first()
        if existing:
            return jsonify(error="User already registered for this event"), 400

        # Minimal hero validation
        hero = db.session.get(Hero, hero_id)
        if not hero:
            return jsonify(error="Hero not found"), 404

        entrant = Entrant(
            name=hero.name,
            alias=hero.full_name or hero.alias,
            event_id=int(event_id),
            user_id=int(user_id),
            hero_id=int(hero_id),
            dropped=False,
        )
        db.session.add(entrant)
        db.session.commit()

        return jsonify(
            entrant.to_dict(include_event=True, include_hero=True, include_user=True)
        ), 201

    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify(error=f"Failed to register entrant: {str(e)}"), 500


@bp.route("/unregister/<int:event_id>", methods=["DELETE"])
@jwt_required()
def unregister_user_from_event(event_id):
    """User: unregister from an event.
    - Hard delete if no matches
    - Soft delete if matches exist
    """
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    try:
        entrant = Entrant.query.filter_by(user_id=user_id, event_id=event_id).first()
        if not entrant:
            abort(404)

        has_matches = (
            Match.query.filter(
                (Match.entrant1_id == entrant.id)
                | (Match.entrant2_id == entrant.id)
                | (Match.winner_id == entrant.id)
            ).count()
            > 0
        )

        if has_matches:
            entrant.soft_delete()
            db.session.commit()
            return jsonify(
                entrant.to_dict(include_event=True, include_hero=True, include_user=True)
            ), 200
        else:
            db.session.delete(entrant)
            db.session.commit()
            return "", 204
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify(error="Failed to unregister entrant"), 500


# ------------------------
# ADMIN CRUD ENDPOINTS
# ------------------------
@bp.route("", methods=["POST"])
@jwt_required()
def create_entrant():
    """Admin: Create entrant manually."""
    data = request.get_json() or {}
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
            user_id=data.get("user_id"),
            hero_id=data.get("hero_id"),
        )
        db.session.add(entrant)
        db.session.commit()

        return jsonify(
            entrant.to_dict(include_event=True, include_hero=True, include_user=True)
        ), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify(error="Failed to create entrant"), 500


@bp.route("", methods=["GET"])
@jwt_required(optional=True)
def get_entrants():
    """Retrieve entrants. Supports ?event_id=X&user_id=Y filters."""
    try:
        event_id = request.args.get("event_id", type=int)
        user_id = request.args.get("user_id", type=int)

        query = Entrant.query
        if event_id:
            query = query.filter_by(event_id=event_id)
        if user_id:
            query = query.filter_by(user_id=user_id)

        entrants = query.all()
        return jsonify([
            e.to_dict(include_event=True, include_hero=True, include_user=True)
            for e in entrants
        ]), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify(error="Failed to fetch entrants"), 500


@bp.route("/<int:entrant_id>", methods=["PUT"])
@jwt_required()
def update_entrant(entrant_id):
    """Admin: Update entrant fields."""
    try:
        entrant = db.session.get(Entrant, entrant_id)
        if not entrant:
            abort(404)
        data = request.get_json() or {}
        for key, value in data.items():
            setattr(entrant, key, value)
        db.session.commit()
        return jsonify(
            entrant.to_dict(include_event=True, include_hero=True, include_user=True)
        ), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify(error="Failed to update entrant"), 500


@bp.route("/<int:entrant_id>", methods=["DELETE"])
@jwt_required()
def delete_entrant(entrant_id):
    """Admin: Delete entrant.
    - Hard delete if not in matches
    - Soft delete if in matches
    """
    try:
        entrant = db.session.get(Entrant, entrant_id)
        if not entrant:
            abort(404)

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
            return jsonify(
                entrant.to_dict(include_event=True, include_hero=True, include_user=True)
            ), 200
        else:
            db.session.delete(entrant)
            db.session.commit()
            return "", 204
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify(error="Failed to delete entrant"), 500
