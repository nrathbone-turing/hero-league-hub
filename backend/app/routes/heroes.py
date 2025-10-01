# backend/app/routes/heroes.py
# Provides routes for fetching and persisting heroes
# - /api/heroes?search=...&page=...&per_page=... → search external API with pagination (persists heroes in DB)
# - /api/heroes/<id> → get a specific hero (cached in DB if available, otherwise fetched from API)
# - Normalizes hero objects before returning

from flask import Blueprint, request, jsonify
from backend.app.extensions import db
from backend.app.models.models import Hero
from backend.app.config import Config
import requests
import traceback

heroes_bp = Blueprint("heroes", __name__)

# ------------------------------
# Utility: normalize API response
# ------------------------------
from backend.app.models.models import API_ALIGNMENT_MAP

def normalize_hero(data):
    raw_alignment = data.get("biography", {}).get("alignment")
    alignment = API_ALIGNMENT_MAP.get(raw_alignment, "unknown")

    return {
        "id": int(data.get("id")),
        "name": data.get("name"),
        "full_name": data.get("biography", {}).get("full-name"),
        "alias": None,  # placeholder for now
        "alignment": alignment,
        "image": data.get("image", {}).get("url"),
        "powerstats": data.get("powerstats"),
        "biography": data.get("biography"),
        "appearance": data.get("appearance"),
        "work": data.get("work"),
        "connections": data.get("connections"),
    }

# ------------------------------
# GET /api/heroes?search=batman&page=1&per_page=10
# ------------------------------
@heroes_bp.route("", methods=["GET"])
def search_heroes():
    query = request.args.get("search")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))

    if not query:
        return jsonify(error="Missing search query"), 400

    try:
        url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/search/{query}"
        resp = requests.get(url)
        if not resp.ok:
            return jsonify(error="External API error"), resp.status_code

        results = resp.json().get("results", [])
        normalized = [normalize_hero(h) for h in results]

        # Persist heroes in DB (skip if already exists)
        for h in normalized:
            try:
                hero = db.session.get(h["id"])
                if not hero:
                    print(f"Persisting hero {h['id']} - {h['name']}")
                    hero = Hero(**h)
                    db.session.add(hero)
            except Exception as e:
                print(f"⚠️ Failed to persist hero {h['id']}: {e}")
        db.session.commit()

        # Manual pagination
        total = len(normalized)
        start = (page - 1) * per_page
        end = start + per_page
        paginated = normalized[start:end]

        return jsonify({
            "results": paginated,
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }), 200
    except Exception:
        traceback.print_exc()
        return jsonify(error="Failed to fetch heroes"), 500


# ------------------------------
# GET /api/heroes/<id>
# ------------------------------
@heroes_bp.route("/<int:hero_id>", methods=["GET"])
def get_hero(hero_id):
    try:
        # 🔹 First try DB
        hero = db.session.get(hero_id)
        if hero:
            return jsonify(hero.to_dict()), 200

        # fallback → fetch from API
        url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/{hero_id}"
        resp = requests.get(url)
        if not resp.ok:
            return jsonify(error="External API error"), resp.status_code

        data = normalize_hero(resp.json())

        # persist in DB
        hero = Hero(**data)
        db.session.add(hero)
        db.session.commit()

        return jsonify(hero.to_dict()), 200
    except Exception:
        traceback.print_exc()
        return jsonify(error="Failed to fetch hero"), 500
