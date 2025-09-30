# File: backend/tests/test_models.py
# Purpose: Unit tests for Event, Entrant, and Match models.
# Notes:
# - Uses pytest with fixtures defined in backend/tests/conftest.py
# - Runs against an in-memory SQLite database for speed & isolation

import pytest
from sqlalchemy.exc import IntegrityError, StatementError
from backend.app.models import Event, Entrant, Match


def test_create_event_valid_status(session):
    event = Event(name="Hero Cup", date="2025-09-12", rules="Bo3", status="drafting")
    session.add(event)
    session.commit()
    assert event.id is not None
    assert event.status == "drafting"


def test_event_invalid_status_raises(session):
    bad = Event(name="Bad Cup", date="2025-09-12", rules="Bo1", status="open")
    session.add(bad)
    # Exception happens when flushing to DB
    with pytest.raises((LookupError, StatementError)):
        session.flush()


def test_create_entrant_with_event(session):
    event = Event(name="Hero Cup", date="2025-09-12", rules="Bo3", status="published")
    entrant = Entrant(name="Spiderman", alias="Webslinger", event=event)
    session.add_all([event, entrant])
    session.commit()
    assert entrant.id is not None
    assert entrant.event == event


def test_create_match_with_event_and_entrants(session):
    event = Event(name="Hero Cup", date="2025-09-12", rules="Bo3", status="published")
    entrant1 = Entrant(name="Spiderman", alias="Webslinger", event=event)
    entrant2 = Entrant(name="Venom", alias="Symbiote", event=event)
    session.add_all([event, entrant1, entrant2])
    session.flush()  # get IDs

    match = Match(
        event=event,
        round=1,
        entrant1_id=entrant1.id,
        entrant2_id=entrant2.id,
        scores="2-1",
        winner_id=entrant1.id,
    )
    session.add(match)
    session.commit()
    assert match.id is not None
    assert match.round == 1
    assert match.scores == "2-1"
    assert match.winner_id == entrant1.id


def test_match_cannot_have_same_entrant_for_both_slots(session):
    event = Event(name="Weird Cup", status="drafting")
    entrant = Entrant(name="SoloMan", event=event)
    session.add_all([event, entrant])
    session.flush()

    bad_match = Match(
        event=event,
        round=1,
        entrant1_id=entrant.id,
        entrant2_id=entrant.id,
        scores="0-0",
    )
    session.add(bad_match)
    with pytest.raises(IntegrityError):
        session.flush()  # fail on constraint
    session.rollback()


def test_event_to_dict_with_no_entrants_or_matches(session):
    event = Event(name="Empty Cup", status="drafting")
    session.add(event)
    session.commit()
    data = event.to_dict()
    assert data["entrant_count"] == 0


def test_entrant_repr_with_no_alias(session):
    event = Event(name="Alias Cup", status="drafting")
    entrant = Entrant(name="Nameless", event=event, alias=None)
    session.add_all([event, entrant])
    session.commit()
    assert "Nameless" in repr(entrant)


def test_match_to_dict_with_missing_winner(session):
    event = Event(name="Mystery Cup", status="drafting")
    e1 = Entrant(name="Hero", event=event)
    e2 = Entrant(name="Villain", event=event)
    match = Match(event=event, round=1, entrant1_id=1, entrant2_id=2, scores="0-0")
    session.add_all([event, e1, e2, match])
    session.commit()
    data = match.to_dict()
    assert data["winner_id"] is None


def test_soft_delete_marks_entrant_as_dropped(session):
    event = Event(name="Drop Cup", status="drafting")
    entrant = Entrant(name="TempHero", alias="Alias", event=event)
    session.add_all([event, entrant])
    session.commit()

    # Call the model method directly
    entrant.soft_delete()
    session.commit()

    refreshed = session.get(Entrant, entrant.id)
    assert refreshed.dropped is True
    assert refreshed.name == "Dropped"
    assert refreshed.alias is None
