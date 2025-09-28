# File: backend/app/models/models.py

from sqlalchemy import Enum, CheckConstraint
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database import db

# Allowed event statuses
EVENT_STATUSES = ("drafting", "published", "cancelled", "completed")


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String, nullable=True)
    rules = db.Column(db.String, nullable=True)
    status = db.Column(
        Enum(*EVENT_STATUSES, name="event_status", validate_strings=True),
        nullable=False,
        default="drafting",
    )

    entrants = db.relationship(
        "Entrant", back_populates="event", cascade="all, delete-orphan"
    )
    matches = db.relationship(
        "Match", back_populates="event", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Event {self.name} ({self.date}) - {self.status}>"

    def to_dict(self, include_related=False):
        data = {
            "id": self.id,
            "name": self.name,
            "date": self.date,
            "rules": self.rules,
            "status": self.status,
            "entrant_count": len(self.entrants) if self.entrants else 0,
        }
        if include_related:
            data["entrants"] = [e.to_dict() for e in self.entrants]
            data["matches"] = [m.to_dict() for m in self.matches]
        return data


class Entrant(db.Model):
    __tablename__ = "entrants"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    alias = db.Column(db.String(80), nullable=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    dropped = db.Column(db.Boolean, default=False, nullable=False)

    event = db.relationship("Event", back_populates="entrants")

    def __repr__(self):
        status = "dropped" if self.dropped else "active"
        return f"<Entrant {self.name} ({self.alias}) - {status}>"

    def soft_delete(self):
        """Mark entrant as dropped instead of deleting."""
        self.name = "Dropped"
        self.alias = None
        self.dropped = True

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "alias": self.alias,
            "event_id": self.event_id,
            "dropped": self.dropped,
        }


class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    round = db.Column(db.Integer, nullable=True)
    entrant1_id = db.Column(db.Integer, db.ForeignKey("entrants.id"), nullable=True)
    entrant2_id = db.Column(db.Integer, db.ForeignKey("entrants.id"), nullable=True)
    scores = db.Column(db.String, nullable=True)
    winner_id = db.Column(db.Integer, db.ForeignKey("entrants.id"), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "entrant1_id IS NULL OR entrant1_id != entrant2_id",
            name="check_distinct_entrants",
        ),
    )

    event = db.relationship("Event", back_populates="matches")

    def __repr__(self):
        return f"<Match Event {self.event_id} Round {self.round}>"

    def to_dict(self, include_names=False):
        data = {
            "id": self.id,
            "event_id": self.event_id,
            "round": self.round,
            "entrant1_id": self.entrant1_id,
            "entrant2_id": self.entrant2_id,
            "scores": self.scores,
            "winner_id": self.winner_id,
        }

        if include_names:
            e1 = db.session.get(Entrant, self.entrant1_id) if self.entrant1_id else None
            e2 = db.session.get(Entrant, self.entrant2_id) if self.entrant2_id else None
            w = db.session.get(Entrant, self.winner_id) if self.winner_id else None

            data["entrant1"] = e1.to_dict() if e1 else None
            data["entrant2"] = e2.to_dict() if e2 else None
            data["winner"] = w.to_dict() if w else None

        return data


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "is_admin": self.is_admin,
        }
