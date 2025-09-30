# backend/app/__init__.py
# Initializes Flask app, database, JWT, and registers Blueprints for API routes

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from backend.app.config import Config
from backend.app.extensions import db, migrate
from backend.app.routes.events import bp as events_bp
from backend.app.routes.entrants import bp as entrants_bp
from backend.app.routes.matches import bp as matches_bp
from backend.app.routes.auth import auth_bp
from backend.app.blocklist import jwt_blocklist


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "Hero League Hub"}

    # ------------------------
    # Initialize extensions
    # ------------------------
    db.init_app(app)
    migrate.init_app(app, db)

    # Explicit CORS config
    CORS(
        app,
        origins=[Config.FRONTEND_URL],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    jwt = JWTManager(app)

    # ------------------------
    # Custom JWT error handlers
    # ------------------------
    @jwt.unauthorized_loader
    def handle_missing_token(err_str):
        return jsonify(error="Missing Authorization Header"), 401

    @jwt.invalid_token_loader
    def handle_invalid_token(err_str):
        return jsonify(error="Invalid or expired token"), 401

    @jwt.expired_token_loader
    def handle_expired_token(jwt_header, jwt_payload):
        return jsonify(error="Invalid or expired token"), 401

    @jwt.revoked_token_loader
    def handle_revoked_token(jwt_header, jwt_payload):
        return jsonify(error="Invalid or expired token"), 401

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        return jwt_payload["jti"] in jwt_blocklist

    # ------------------------
    # Register Blueprints
    # ------------------------
    app.register_blueprint(events_bp)
    app.register_blueprint(entrants_bp)
    app.register_blueprint(matches_bp)
    app.register_blueprint(auth_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(port=5500, debug=True)
