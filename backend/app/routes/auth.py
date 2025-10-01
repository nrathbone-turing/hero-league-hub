# File: backend/app/routes/auth.py
# Provides signup, login, logout, and protected routes
# Uses JWT for token-based authentication
# Logout revokes tokens by adding their JTI to a global blocklist

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from backend.app.extensions import db
from backend.app.models.models import User
from backend.app.blocklist import jwt_blocklist
import traceback

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    # redact password before logging
    safe_data = {k: v for k, v in data.items() if k != "password"}
    print("DEBUG signup payload:", safe_data)

    try:
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not all([username, email, password]):
            return jsonify(error="Missing required fields"), 400

        if User.query.filter_by(email=email).first():
            return jsonify(error="Email already exists"), 400

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        print(f"✅ Created user {user.id} ({email})")
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        traceback.print_exc()
        print(f"❌ Error during signup: {e}")
        return jsonify(error="Failed to sign up"), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    # redact password before logging
    safe_data = {k: v for k, v in data.items() if k != "password"}
    print("DEBUG login payload:", safe_data)

    try:
        email = data.get("email")
        password = data.get("password")

        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return jsonify(error="Invalid credentials"), 401

        token = create_access_token(identity=str(user.id))
        print(f"✅ Login success for {email}")
        return jsonify(access_token=token), 200
    except Exception as e:
        traceback.print_exc()
        print(f"❌ Error during login: {e}")
        return jsonify(error="Failed to log in"), 500


@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required()
def logout():
    try:
        jti = get_jwt()["jti"]
        jwt_blocklist.add(jti)
        print(f"✅ Token revoked: {jti}")
        return jsonify(message="Logged out"), 200
    except Exception as e:
        traceback.print_exc()
        print(f"❌ Error during logout: {e}")
        return jsonify(error="Failed to log out"), 500


@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    try:
        user_id = get_jwt_identity()
        user = db.session.get(int(user_id))
        return jsonify(message=f"Hello {user.username}!"), 200
    except Exception as e:
        traceback.print_exc()
        print(f"❌ Error accessing protected route: {e}")
        return jsonify(error="Failed to fetch protected resource"), 500
