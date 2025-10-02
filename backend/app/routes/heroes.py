# backend/app/routes/heroes.py
# Provides routes for fetching and persisting heroes
# - /api/heroes?search=...&page=...&per_page=... → search external API with pagination (persists heroes in DB)
# - /api/heroes/<id> → get a specific hero (cached in DB if available, otherwise fetched from API)
# - Normalizes hero objects before returning

from flask import Blueprint, request, jsonify, abort, Response, send_file
from backend.app.extensions import db
from backend.app.models.models import Hero
from backend.app.config import Config
import requests
import traceback
import io

heroes_bp = Blueprint("heroes", __name__)

# ------------------------------
# Utility: normalize API response
# ------------------------------
from backend.app.models.models import API_ALIGNMENT_MAP

def normalize_hero(data):
    raw_alignment = data.get("biography", {}).get("alignment")
    alignment = API_ALIGNMENT_MAP.get(raw_alignment, "unknown")
    hero_id = int(data.get("id"))

    external_url = data.get("image", {}).get("url")

    return {
        "id": hero_id,
        "name": data.get("name"),
        "full_name": data.get("biography", {}).get("full-name"),
        "alias": None,
        "alignment": alignment,
        "image": external_url,   # store actual external image URL
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
                hero = db.session.get(Hero, h["id"])  # assign to a variable
                if not hero:
                    print(f"Persisting hero {h['id']} - {h['name']}")
                    hero = Hero(**h)
                    db.session.add(hero)
                else:
                    hero.name = h["name"]
                    hero.full_name = h["full_name"]
                    hero.alias = h["alias"]
                    hero.alignment = h["alignment"]
                    hero.image = h["image"]
                    hero.powerstats = h["powerstats"]
                    hero.biography = h["biography"]
                    hero.appearance = h["appearance"]
                    hero.work = h["work"]
                    hero.connections = h["connections"]
            except Exception as e:
                db.session.rollback()
                print(f"⚠️ Failed to persist hero {h.get('id')}: {e}")

        db.session.commit()

        # Manual pagination
        total = len(normalized)
        start = (page - 1) * per_page
        end = start + per_page
        paginated = normalized[start:end]

        results = []
        for hero in normalized:
            h = hero.copy()
            h["proxy_image"] = f"/api/heroes/{h['id']}/image"
            results.append(h)

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
        hero = db.session.get(Hero, hero_id)   # check local cache
        if hero:
            return jsonify(hero.to_dict()), 200

        # fallback: external API
        url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/{hero_id}"
        resp = requests.get(url)
        if not resp.ok:
            return jsonify(error="External API error"), resp.status_code

        data = normalize_hero(resp.json())

        # create and persist
        hero = Hero(**data)
        db.session.add(hero)
        db.session.commit()

        hero_dict = hero.to_dict()
        hero_dict["proxy_image"] = f"/api/heroes/{hero.id}/image"
        
        return jsonify(hero.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        return jsonify(error="Failed to fetch hero"), 500


# ------------------------------
# GET /api/heroes/<id>/image
# ------------------------------

@heroes_bp.route("/<int:hero_id>/image", methods=["GET"])
def get_hero_image(hero_id):
    try:
        hero = db.session.get(Hero, hero_id)
        if hero and hero.image:
            image_url = hero.image
        else:
            # fetch from external API if not cached
            url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/{hero_id}"
            resp = requests.get(url)
            if not resp.ok:
                return jsonify(error="External API error"), resp.status_code

            data = resp.json()
            image_url = data.get("image", {}).get("url")
            if not image_url:
                return jsonify(error="No image available"), 404

            if hero:
                hero.image = image_url
            else:
                normalized = normalize_hero(data)
                hero = Hero(**normalized)
                db.session.add(hero)
            db.session.commit()

        # download the image
        proxied = requests.get(image_url, stream=True)
        if not proxied.ok:
            return jsonify(error="Failed to fetch external image"), 502

        return send_file(
            io.BytesIO(proxied.content),
            mimetype=proxied.headers.get("Content-Type", "image/jpeg"),
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=f"Failed to fetch hero image: {str(e)}"), 500
