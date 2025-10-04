# backend/app/routes/heroes.py
# Provides routes for fetching and persisting heroes
# - /api/heroes?search=...&page=...&per_page=...
# - /api/heroes/<id>
# - /api/heroes/<id>/image (backend image proxy to avoid hotlink/CORS)

from flask import Blueprint, request, jsonify, Response
from backend.app.extensions import db
from backend.app.models.models import Hero, API_ALIGNMENT_MAP
from backend.app.config import Config
import requests
import traceback

heroes_bp = Blueprint("heroes", __name__)

UA = {
    "User-Agent": "HeroLeagueHub/1.0 (+https://localhost)",
    "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://www.superherodb.com/",
}


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
        "image": (data.get("image", {}) or {}).get("url"),
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

        # Upsert heroes
        for h in normalized:
            try:
                hero = db.session.get(Hero, h["id"])
                if not hero:
                    db.session.add(Hero(**h))
                else:
                    for key, val in h.items():
                        setattr(hero, key, val)
            except Exception as e:
                db.session.rollback()
                print(f"⚠️ Failed to persist hero {h.get('id')}: {e}")
        db.session.commit()

        # Attach proxy_image for frontend use
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
                db.session.add(Hero(**normalize_hero(data)))
                db.session.commit()

        proxied = requests.get(image_url, headers=UA, timeout=12)
        if proxied.status_code != 200 or not proxied.content:
            # console log to help debugging when a CDN blocks the request
            print(f"[image-proxy] upstream {proxied.status_code} for {image_url}")
            return jsonify(error="Failed to fetch external image"), 502

        content_type = proxied.headers.get("Content-Type", "image/jpeg")
        resp = Response(proxied.content, status=200, mimetype=content_type)
        resp.headers["Cache-Control"] = "public, max-age=86400"
        return resp
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=f"Failed to fetch hero image: {str(e)}"), 500
    

@heroes_bp.route("/browse", methods=["GET"])
def browse_heroes():
    """
    Return all heroes stored in DB, with pagination.
    Used by frontend dropdowns (event registration, etc.).
    """
    try:
        page = max(int(request.args.get("page", 1)), 1)
        per_page = max(min(int(request.args.get("per_page", 50)), 100), 1)

        query = Hero.query.order_by(Hero.name.asc())
        total = query.count()
        heroes = query.offset((page - 1) * per_page).limit(per_page).all()

        results = []
        for h in heroes:
            hero_dict = h.to_dict()
            hero_dict["proxy_image"] = f"/api/heroes/{h.id}/image"
            results.append(hero_dict)

        return jsonify(
            {
                "results": results,
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": (total + per_page - 1) // per_page,
            }
        ), 200
    except Exception:
        traceback.print_exc()
        return jsonify(error="Failed to browse heroes"), 500
