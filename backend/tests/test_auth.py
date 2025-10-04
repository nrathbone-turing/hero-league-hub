# File: backend/tests/test_auth.py
# Purpose: Tests for user authentication (signup, login, logout, protected routes)
# Notes:
# - Validates JWT auth flow using flask-jwt-extended
# - Ensures protected routes require valid tokens
# - Confirms logout response is returned (and revoked tokens are rejected)

import time


def test_signup_creates_user(client):
    """Test that POST /api/signup creates a user and returns JSON without password."""
    resp = client.post(
        "/api/signup",
        json={
            "username": "alice",
            "email": "alice@example.com",
            "password": "password123",
        },
    )
    assert resp.status_code == 201
    data = resp.get_json()
    # User fields are nested under "user"
    assert data["user"]["username"] == "alice"
    assert "password" not in data["user"]


def test_login_returns_token(client):
    """Test that login with correct credentials returns an access token."""
    client.post(
        "/api/signup",
        json={"username": "bob", "email": "bob@example.com", "password": "secret"},
    )
    resp = client.post(
        "/api/login", json={"email": "bob@example.com", "password": "secret"}
    )
    assert resp.status_code == 200
    token = resp.get_json().get("access_token")
    assert token


def test_protected_route_requires_auth(client):
    """Protected route should reject missing Authorization header."""
    resp = client.get("/api/protected")
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Missing Authorization Header"


def test_protected_route_with_auth(client):
    """Protected route should succeed with a valid token."""
    client.post(
        "/api/signup",
        json={"username": "cathy", "email": "cathy@example.com", "password": "pass"},
    )
    login_resp = client.post(
        "/api/login", json={"email": "cathy@example.com", "password": "pass"}
    )
    token = login_resp.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/protected", headers=headers)
    assert resp.status_code == 200
    assert "message" in resp.get_json()


def test_logout_returns_ok(client):
    """Logout endpoint should revoke token and return confirmation message."""
    client.post(
        "/api/signup",
        json={"username": "dave", "email": "dave@example.com", "password": "mypw"},
    )
    login_resp = client.post(
        "/api/login", json={"email": "dave@example.com", "password": "mypw"}
    )
    token = login_resp.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    logout_resp = client.delete("/api/logout", headers=headers)
    assert logout_resp.status_code == 200
    assert logout_resp.get_json()["message"] == "Logged out"


def test_login_with_wrong_password(client, session):
    """Login should fail with incorrect password."""
    from backend.app.models.models import User

    user = User(username="edgeuser", email="edge@example.com")
    user.set_password("correctpass")
    session.add(user)
    session.commit()

    resp = client.post(
        "/api/login", json={"email": "edge@example.com", "password": "wrongpass"}
    )
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Invalid credentials"


def test_signup_with_duplicate_email(client, session):
    """Signup should fail if email already exists."""
    from backend.app.models.models import User

    user = User(username="dup", email="dup@example.com")
    user.set_password("pass")
    session.add(user)
    session.commit()

    resp = client.post(
        "/api/signup",
        json={"username": "dup2", "email": "dup@example.com", "password": "pass"},
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Email already exists"


def test_protected_route_with_invalid_token(client):
    """Protected route should reject an invalid JWT."""
    headers = {"Authorization": "Bearer not.a.real.token"}
    resp = client.get("/api/protected", headers=headers)

    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Invalid or expired token"


def test_delete_event_requires_auth(client, create_event):
    """Deleting an event without auth should fail."""
    event = create_event()
    resp = client.delete(f"/api/events/{event.id}")
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Missing Authorization Header"


def test_create_entrant_with_auth(client, create_event, auth_user_and_header):
    """Authenticated user can create an entrant via /api/entrants."""
    _, auth_header = auth_user_and_header
    event = create_event()
    data = {"name": "HeroEdge", "alias": "Edgecase", "event_id": event.id}
    resp = client.post("/api/entrants", json=data, headers=auth_header)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["name"] == "HeroEdge"
    assert body["alias"] == "Edgecase"


def test_signup_missing_fields(client):
    """Signup should return 400 if required fields are missing."""
    resp = client.post("/api/signup", json={"email": "no_user@example.com"})
    assert resp.status_code == 400
    error = resp.get_json()["error"].lower()
    assert "missing" in error or "required" in error


# -------------------------
# Expiry + revocation tests
# -------------------------

def test_expired_token_denied(client):
    """Expired tokens should be rejected on protected routes."""
    client.post(
        "/api/signup",
        json={
            "username": "expireuser",
            "email": "expire@example.com",
            "password": "pw",
        },
    )
    login_resp = client.post(
        "/api/login", json={"email": "expire@example.com", "password": "pw"}
    )
    token = login_resp.get_json()["access_token"]

    time.sleep(2)  # short expiry in TestConfig

    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/protected", headers=headers)
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Invalid or expired token"


def test_revoked_token_denied(client):
    """Revoked (logged out) tokens should be rejected on protected routes."""
    client.post(
        "/api/signup",
        json={"username": "revoker", "email": "revoker@example.com", "password": "pw"},
    )
    login_resp = client.post(
        "/api/login", json={"email": "revoker@example.com", "password": "pw"}
    )
    token = login_resp.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    client.delete("/api/logout", headers=headers)  # revoke token

    resp = client.get("/api/protected", headers=headers)
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Invalid or expired token"


def test_password_is_hashed_in_db(client, session):
    """Passwords should be hashed in the DB, not stored in plain text."""
    resp = client.post(
        "/api/signup",
        json={"username": "hashme", "email": "hash@example.com", "password": "rawpass"},
    )
    assert resp.status_code == 201

    from backend.app.models.models import User
    user = session.query(User).filter_by(email="hash@example.com").first()

    # The hash should be different from the raw password
    assert user.password_hash != "rawpass"

    # And check_password should succeed
    assert user.check_password("rawpass")
