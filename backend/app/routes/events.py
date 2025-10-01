# File: backend/app/routes/events.py

from flask import Blueprint, request, jsonify, abort
from sqlalchemy import func, case, asc, desc
from flask_jwt_extended import jwt_required
from backend.app.models.models import Event, Entrant
from backend.app.extensions import db
import traceback

bp = Blueprint("events", __name__, url_prefix="/events")

STATUS_ORDER = case(
    (Event.status == "published", 1),
    (Event.status == "drafting", 2),
    (Event.status == "completed", 3),
    (Event.status == "cancelled", 4),
    else_=5,
)


@bp.route("", methods=["POST"])
@jwt_required()
def create_event():
    data = request.get_json() or {}
    print("DEBUG create_event payload:", data)

    try:
        event = Event(
            name=data.get("name"),
            date=data.get("date"),
            rules=data.get("rules"),
            status=data.get("status"),
        )
        db.session.add(event)
        db.session.commit()
        print(f"✅ Created event {event.id}")
        return jsonify(event.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error creating event: {e}")
        return jsonify(error="Failed to create event"), 500


@bp.route("", methods=["GET"])
def get_events():
    try:
        events = (
            db.session.query(
                Event.id,
                Event.name,
                Event.date,
                Event.rules,
                Event.status,
                func.count(Entrant.id).label("entrant_count"),
            )
            .outerjoin(Entrant, Entrant.event_id == Event.id)
            .group_by(Event.id)
            .order_by(
                desc(Event.date),  # newest first
                STATUS_ORDER,  # published → drafting → completed → cancelled
                asc(Event.name),  # alphabetical
            )
            .all()
        )
        return (
            jsonify(
                [
                    {
                        "id": e.id,
                        "name": e.name,
                        "date": (
                            e.date.isoformat()
                            if hasattr(e.date, "isoformat")
                            else e.date
                        ),
                        "rules": e.rules,
                        "status": e.status,
                        "entrant_count": e.entrant_count,
                    }
                    for e in events
                ]
            ),
            200,
        )
    except Exception as e:
        traceback.print_exc()
        print(f"❌ Error fetching events: {e}")
        return jsonify(error="Failed to fetch events"), 500


@bp.route("/<int:event_id>", methods=["GET"])
def get_event(event_id):
    try:
        event = db.session.get(Event, event_id)
        if not event:
            abort(404)
        data = event.to_dict(include_related=True)
        data["matches"] = [m.to_dict(include_names=True) for m in event.matches]
        return jsonify(data), 200
    except Exception as e:
        traceback.print_exc()
        print(f"❌ Error fetching event {event_id}: {e}")
        return jsonify(error="Failed to fetch event"), 500


@bp.route("/<int:event_id>", methods=["PUT"])
@jwt_required()
def update_event(event_id):
    try:
        event = db.session.get(Event, event_id)
        if not event:
            abort(404)
        data = request.get_json() or {}
        for key, value in data.items():
            setattr(event, key, value)
        db.session.commit()
        print(f"✅ Updated event {event_id}")
        return jsonify(event.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error updating event {event_id}: {e}")
        return jsonify(error="Failed to update event"), 500


@bp.route("/<int:event_id>", methods=["DELETE"])
@jwt_required()
def delete_event(event_id):
    try:
        event = db.session.get(Event, event_id)
        if not event:
            abort(404)
        db.session.delete(event)
        db.session.commit()
        print(f"✅ Deleted event {event_id}")
        return "", 204
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error deleting event {event_id}: {e}")
        return jsonify(error="Failed to delete event"), 500
