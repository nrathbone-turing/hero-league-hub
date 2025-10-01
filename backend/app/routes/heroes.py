# backend/app/routes/heroes.py
# Provides routes for fetching and persisting heroes
# Endpoints:
#   - GET /api/heroes?search=... → fetch heroes by name from external API
#   - GET /api/heroes/<id> → fetch a specific hero (cached in DB if available)
# Notes:
#   - Uses Superhero API (requires SUPERHERO_API_KEY in .env)
#   - Normalizes hero objects into consistent shape
#   - Persists heroes locally for caching/analytics
#   - Falls back to API if not cached

from flask import Blueprint, request, jsonify
from backend.app.extensions import db
from backend.app.models.models import Hero  # model lives in models.py
from backend.app.config import Config
import requests
import traceback

heroes_bp = Blueprint("heroes", __name__)

# -----------------------------
# Utility: normalize API response
# -----------------------------
def normalize_hero(data):
    """Convert raw API hero data into normalized dict for DB and frontend."""
    return {
        "id": int(data.get("id")),
        "name": data.get("name"),
        "image": data.get("image", {}).get("url"),
        "powerstats": data.get("powerstats"),
        "biography": data.get("biography"),
        "appearance": data.get("appearance"),
        "work": data.get("work"),
        "connections": data.get("connections"),
    }


# -----------------------------
# GET /api/heroes?search=batman
# -----------------------------
@heroes_bp.route("", methods=["GET"])
def search_heroes():
    """Search for heroes by name. Results are cached in DB."""
    query = request.args.get("search")
    if not query:
        return jsonify(error="Missing search query"), 400

    try:
        # Call external API
        url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/search/{query}"
        resp = requests.get(url)
        if not resp.ok:
            return jsonify(error="External API error"), resp.status_code

        # Normalize results
        results = resp.json().get("results", [])
        normalized = [normalize_hero(h) for h in results if "id" in h]

        # Cache results locally if missing
        for h in normalized:
            if not Hero.query.get(h["id"]):
                db.session.add(Hero(**h))
        db.session.commit()

        return jsonify(normalized), 200
    except Exception:
        traceback.print_exc()
        return jsonify(error="Failed to fetch heroes"), 500


# -----------------------------
# GET /api/heroes/<id>
# -----------------------------
@heroes_bp.route("/<int:hero_id>", methods=["GET"])
def get_hero(hero_id):
    """Fetch single hero by ID. Uses DB cache first, falls back to API."""
    try:
        # Check DB cache
        hero = Hero.query.get(hero_id)
        if hero:
            return jsonify(hero.to_dict()), 200

        # Fallback to external API
        url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/{hero_id}"
        resp = requests.get(url)
        if not resp.ok:
            return jsonify(error="External API error"), resp.status_code

        # Normalize + persist
        data = normalize_hero(resp.json())
        hero = Hero(**data)
        db.session.add(hero)
        db.session.commit()

        return jsonify(hero.to_dict()), 200
    except Exception:
        traceback.print_exc()
        return jsonify(error="Failed to fetch hero"), 500
