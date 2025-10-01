# backend/app/routes/heroes.py
# Provides routes for fetching and persisting heroes
# - /api/heroes?search=... → fetch from external API
# - /api/heroes/<id> → get a specific hero (cached in DB if available)
# - Normalizes hero objects before returning

from flask import Blueprint, request, jsonify
from backend.app.extensions import db
from backend.app.models.hero import Hero
from backend.app.config import Config
import requests
import traceback

heroes_bp = Blueprint("heroes", __name__)

# Utility: normalize API response
def normalize_hero(data):
    return {
        "id": int(data["id"]),
        "name": data["name"],
        "image": data.get("image", {}).get("url") or data.get("image"),
        "powerstats": data.get("powerstats", {}),
    }

# GET /api/heroes?search=batman
@heroes_bp.route("", methods=["GET"])
def search_heroes():
    query = request.args.get("search")
    if not query:
        return jsonify(error="Missing search query"), 400

    try:
        url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/search/{query}"
        resp = requests.get(url)
        if not resp.ok:
            return jsonify(error="External API error"), resp.status_code

        results = resp.json().get("results", [])
        normalized = [normalize_hero(h) for h in results]

        # Persist heroes in DB if not already
        for h in normalized:
            hero = Hero.query.get(h["id"])
            if not hero:
                hero = Hero(**h)
                db.session.add(hero)
        db.session.commit()

        return jsonify(normalized), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify(error="Failed to fetch heroes"), 500

# GET /api/heroes/<id>
@heroes_bp.route("/<int:hero_id>", methods=["GET"])
def get_hero(hero_id):
    try:
        hero = Hero.query.get(hero_id)
        if hero:
            return jsonify(hero.to_dict()), 200

        # fallback → fetch from API if not in DB
        url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/{hero_id}"
        resp = requests.get(url)
        if not resp.ok:
            return jsonify(error="External API error"), resp.status_code

        data = normalize_hero(resp.json())
        hero = Hero(**data)
        db.session.add(hero)
        db.session.commit()

        return jsonify(hero.to_dict()), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify(error="Failed to fetch hero"), 500
