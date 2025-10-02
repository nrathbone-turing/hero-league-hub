# Provides routes for fetching and persisting heroes
# - /api/heroes?search=...&page=...&per_page=...
# - /api/heroes/<id>
# - /api/heroes/<id>/image (backend image proxy to avoid hotlink/CORS)

from flask import Blueprint, request, jsonify, send_file, Response
from backend.app.extensions import db
from backend.app.models.models import Hero, API_ALIGNMENT_MAP
from backend.app.config import Config
import requests
import traceback
import io

heroes_bp = Blueprint("heroes", __name__)

UA = {"User-Agent": "HeroLeagueHub/1.0 (+https://localhost)"}


def normalize_hero(data):
    raw_alignment = data.get("biography", {}).get("alignment")
    alignment = API_ALIGNMENT_MAP.get(raw_alignment, "unknown")
    hero_id = int(data.get("id") or 0)

    return {
        "id": hero_id,
        "name": data.get("name"),
        "full_name": data.get("biography", {}).get("full-name"),
        "alias": None,
        "alignment": alignment,
        "image": (data.get("image", {}) or {}).get("url"),  # external URL persisted
        "powerstats": data.get("powerstats"),
        "biography": data.get("biography"),
        "appearance": data.get("appearance"),
        "work": data.get("work"),
        "connections": data.get("connections"),
    }


@heroes_bp.route("", methods=["GET"])
def search_heroes():
    query = request.args.get("search", "").strip()
    page = max(int(request.args.get("page", 1)), 1)
    per_page = max(min(int(request.args.get("per_page", 10)), 100), 1)

    if not query:
        return jsonify(error="Missing search query"), 400

    try:
        url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/search/{query}"
        resp = requests.get(url, headers=UA, timeout=10)
        if not resp.ok:
            return jsonify(error="External API error"), resp.status_code

        api_results = resp.json().get("results", []) or []
        normalized = [normalize_hero(h) for h in api_results]

        # Persist / upsert
        for h in normalized:
            try:
                hero = db.session.get(Hero, h["id"])
                if not hero:
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

        # Attach proxy_image BEFORE paginating so the UI always gets it
        for h in normalized:
            h["proxy_image"] = f"/api/heroes/{h['id']}/image"

        total = len(normalized)
        start = (page - 1) * per_page
        end = start + per_page
        paginated = normalized[start:end]

        return jsonify(
            {
                "results": paginated,
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
            }
        ), 200
    except Exception:
        traceback.print_exc()
        return jsonify(error="Failed to fetch heroes"), 500


@heroes_bp.route("/<int:hero_id>", methods=["GET"])
def get_hero(hero_id):
    try:
        hero = db.session.get(Hero, hero_id)
        if not hero:
            # Fetch single hero on cache miss
            url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/{hero_id}"
            resp = requests.get(url, headers=UA, timeout=10)
            if not resp.ok:
                return jsonify(error="External API error"), resp.status_code
            data = normalize_hero(resp.json())
            hero = Hero(**data)
            db.session.add(hero)
            db.session.commit()

        payload = hero.to_dict()
        payload["proxy_image"] = f"/api/heroes/{hero.id}/image"
        return jsonify(payload), 200
    except Exception:
        db.session.rollback()
        traceback.print_exc()
        return jsonify(error="Failed to fetch hero"), 500


@heroes_bp.route("/<int:hero_id>/image", methods=["GET"])
def get_hero_image(hero_id):
    try:
        # Find persisted external URL or fetch it
        hero = db.session.get(Hero, hero_id)
        image_url = hero.image if hero and hero.image else None

        if not image_url:
            url = f"https://superheroapi.com/api/{Config.SUPERHERO_API_KEY}/{hero_id}"
            resp = requests.get(url, headers=UA, timeout=10)
            if not resp.ok:
                return jsonify(error="External API error"), resp.status_code
            data = resp.json()
            image_url = (data.get("image", {}) or {}).get("url")
            if not image_url:
                return jsonify(error="No image available"), 404
            if hero:
                hero.image = image_url
                db.session.commit()
            else:
                # Create minimally so we have a row next time
                new_data = normalize_hero(data)
                db.session.add(Hero(**new_data))
                db.session.commit()

        # Fetch the binary image (avoid streaming chunked—return a single buffer)
        proxied = requests.get(image_url, headers=UA, timeout=12)
        if proxied.status_code != 200 or not proxied.content:
            return jsonify(error="Failed to fetch external image"), 502

        content_type = proxied.headers.get("Content-Type", "image/jpeg")
        resp = Response(proxied.content, status=200, mimetype=content_type)
        resp.headers["Cache-Control"] = "public, max-age=86400"
        return resp
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=f"Failed to fetch hero image: {str(e)}"), 500
