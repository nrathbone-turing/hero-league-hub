# File: backend/app/models/models.py
# Purpose: Core SQLAlchemy models for the Hero League Hub backend.
# Notes:
# - Updated Match.to_dict() to include entrant and winner relationships.
# - Event.to_dict() now calls Match.to_dict(include_entrants=True) for frontend compatibility.

from sqlalchemy import Enum, CheckConstraint
from werkzeug.security import generate_password_hash, check_password_hash
from backend.app.extensions import db
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime

# Allowed event statuses
EVENT_STATUSES = ("drafting", "published", "cancelled", "completed")

# Possible alignments (canonical values used in this app)
HERO_ALIGNMENTS = ("hero", "villain", "antihero", "unknown")

# Mapping from API raw values to canonical alignment strings
API_ALIGNMENT_MAP = {
    "good": "hero",
    "bad": "villain",
    "neutral": "antihero",
    None: "unknown",
    "": "unknown",
}


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

    def to_dict(self, include_related: bool = False, include_counts: bool = True):
        """Serialize Event, optionally with entrants and matches."""
        data = {
            "id": self.id,
            "name": self.name,
            "date": self.date,
            "rules": self.rules,
            "status": self.status,
        }
        if include_counts:
            data["entrant_count"] = len(self.entrants) if self.entrants else 0
        if include_related:
            data["entrants"] = [
                e.to_dict(include_user=True, include_hero=True) for e in self.entrants
            ]
            data["matches"] = [
                m.to_dict(include_entrants=True) for m in self.matches
            ]
        return data


class Entrant(db.Model):
    __tablename__ = "entrants"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    alias = db.Column(db.String(80), nullable=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)

    # Links
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    hero_id = db.Column(db.Integer, db.ForeignKey("heroes.id"), nullable=True)

    dropped = db.Column(db.Boolean, default=False, nullable=False)

    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    updated_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    # Relationships
    event = db.relationship("Event", back_populates="entrants")

    user = db.relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="entrants",
        lazy="joined",
        overlaps="created_entrants,updated_entrants",
    )
    hero = db.relationship("Hero", lazy="joined")

    created_by = db.relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_entrants",
        lazy="joined",
        overlaps="entrants,updated_entrants",
    )
    updated_by = db.relationship(
        "User",
        foreign_keys=[updated_by_id],
        back_populates="updated_entrants",
        lazy="joined",
        overlaps="entrants,created_entrants",
    )

    def __repr__(self):
        status = "dropped" if self.dropped else "active"
        return f"<Entrant {self.name} ({self.alias}) - {status}>"

    def soft_delete(self):
        """Mark entrant as dropped instead of deleting."""
        self.name = "Dropped"
        self.alias = None
        self.dropped = True

    def to_dict(
        self,
        include_event: bool = False,
        include_hero: bool = False,
        include_user: bool = False,
    ):
        """Serialize Entrant with optional relationships."""
        data = {
            "id": self.id,
            "name": self.name,
            "alias": self.alias,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "hero_id": self.hero_id,
            "dropped": self.dropped,
        }
        if include_event and self.event:
            data["event"] = self.event.to_dict(include_counts=True)
        if include_user:
            data["user"] = self.user.to_dict() if self.user else {"id": self.user_id}
        if include_hero:
            data["hero"] = self.hero.to_dict() if self.hero else {"id": self.hero_id}
        return data


class Match(db.Model):
    __tablename__ = "matches"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id"), nullable=False)
    round = db.Column(db.Integer, nullable=True)
    entrant1_id = db.Column(db.Integer, db.ForeignKey("entrants.id"), nullable=True)
    entrant2_id = db.Column(db.Integer, db.ForeignKey("entrants.id"), nullable=True)
    scores = db.Column(db.String, nullable=True)
    winner_id = db.Column(db.Integer, db.ForeignKey("entrants.id"), nullable=True)

    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    updated_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "entrant1_id IS NULL OR entrant1_id != entrant2_id",
            name="check_distinct_entrants",
        ),
    )

    event = db.relationship("Event", back_populates="matches")

    def __repr__(self):
        return f"<Match Event {self.event_id} Round {self.round}>"

    def to_dict(self, include_entrants=False):
        """Serialize Match, optionally including entrant and winner objects."""
        data = {
            "id": self.id,
            "event_id": self.event_id,
            "round": self.round,
            "entrant1_id": self.entrant1_id,
            "entrant2_id": self.entrant2_id,
            "scores": self.scores,
            "winner_id": self.winner_id,
        }
        if include_entrants:
            e1 = db.session.get(Entrant, self.entrant1_id) if self.entrant1_id else None
            e2 = db.session.get(Entrant, self.entrant2_id) if self.entrant2_id else None
            w = db.session.get(Entrant, self.winner_id) if self.winner_id else None

            data["entrant1"] = (
                e1.to_dict(include_user=True, include_hero=True) if e1 else None
            )
            data["entrant2"] = (
                e2.to_dict(include_user=True, include_hero=True) if e2 else None
            )
            data["winner"] = (
                w.to_dict(include_user=True, include_hero=True) if w else None
            )
        return data


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    entrants = db.relationship(
        "Entrant",
        back_populates="user",
        foreign_keys="Entrant.user_id",
        overlaps="created_by,updated_by",
    )
    created_entrants = db.relationship(
        "Entrant",
        back_populates="created_by",
        foreign_keys="Entrant.created_by_id",
        overlaps="user,updated_by",
    )
    updated_entrants = db.relationship(
        "Entrant",
        back_populates="updated_by",
        foreign_keys="Entrant.updated_by_id",
        overlaps="user,created_by",
    )

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


class Hero(db.Model):
    __tablename__ = "heroes"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(128))
    name = db.Column(db.String(128), nullable=False)
    image = db.Column(db.String(256))
    powerstats = db.Column(JSON)
    biography = db.Column(JSON)
    appearance = db.Column(JSON)
    work = db.Column(JSON)
    connections = db.Column(JSON)
    alias = db.Column(db.String(128))
    alignment = db.Column(db.String(20))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "full_name": self.full_name,
            "alias": self.alias,
            "alignment": self.alignment,
            "image": self.image,
            "powerstats": self.powerstats,
            "biography": self.biography,
            "appearance": self.appearance,
            "work": self.work,
            "connections": self.connections,
        }
