# File: backend/tests/test_auth.py
# Purpose: Tests for user authentication (signup, login, logout, protected routes)
# Notes:
# - Validates JWT auth flow using flask-jwt-extended
# - Ensures protected routes require valid tokens
# - Confirms logout response is returned (and revoked tokens are rejected)

import time


def test_signup_creates_user(client):
    resp = client.post(
        "/signup",
        json={
            "username": "alice",
            "email": "alice@example.com",
            "password": "password123",
        },
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["username"] == "alice"
    assert "password" not in data  # password should not be returned


def test_login_returns_token(client):
    client.post(
        "/signup",
        json={"username": "bob", "email": "bob@example.com", "password": "secret"},
    )
    resp = client.post(
        "/login", json={"email": "bob@example.com", "password": "secret"}
    )
    assert resp.status_code == 200
    token = resp.get_json().get("access_token")
    assert token


def test_protected_route_requires_auth(client):
    resp = client.get("/protected")
    assert resp.status_code == 401
    # now expect "Missing Authorization Header"
    assert resp.get_json()["error"] == "Missing Authorization Header"


def test_protected_route_with_auth(client):
    client.post(
        "/signup",
        json={"username": "cathy", "email": "cathy@example.com", "password": "pass"},
    )
    login_resp = client.post(
        "/login", json={"email": "cathy@example.com", "password": "pass"}
    )
    token = login_resp.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/protected", headers=headers)
    assert resp.status_code == 200
    assert "message" in resp.get_json()


def test_logout_returns_ok(client):
    client.post(
        "/signup",
        json={"username": "dave", "email": "dave@example.com", "password": "mypw"},
    )
    login_resp = client.post(
        "/login", json={"email": "dave@example.com", "password": "mypw"}
    )
    token = login_resp.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    logout_resp = client.delete("/logout", headers=headers)
    assert logout_resp.status_code == 200
    # normalize to "Logged out"
    assert logout_resp.get_json()["message"] == "Logged out"


def test_login_with_wrong_password(client, session):
    from backend.app.models import User

    user = User(username="edgeuser", email="edge@example.com")
    user.set_password("correctpass")
    session.add(user)
    session.commit()

    resp = client.post(
        "/login", json={"email": "edge@example.com", "password": "wrongpass"}
    )
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Invalid credentials"


def test_signup_with_duplicate_email(client, session):
    from backend.app.models import User

    user = User(username="dup", email="dup@example.com")
    user.set_password("pass")
    session.add(user)
    session.commit()

    resp = client.post(
        "/signup",
        json={"username": "dup2", "email": "dup@example.com", "password": "pass"},
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Email already exists"


def test_protected_route_with_invalid_token(client):
    headers = {"Authorization": "Bearer not.a.real.token"}
    resp = client.get("/protected", headers=headers)

    assert resp.status_code == 401
    # now guaranteed normalized
    assert resp.get_json()["error"] == "Invalid or expired token"


def test_delete_event_requires_auth(client, create_event):
    event = create_event()
    resp = client.delete(f"/events/{event.id}")
    assert resp.status_code == 401
    # same change here: missing header should match exactly
    assert resp.get_json()["error"] == "Missing Authorization Header"


def test_create_entrant_with_auth(client, create_event, auth_header):
    event = create_event()
    data = {"name": "HeroEdge", "alias": "Edgecase", "event_id": event.id}
    resp = client.post("/entrants", json=data, headers=auth_header)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["name"] == "HeroEdge"
    assert body["alias"] == "Edgecase"


def test_signup_missing_fields(client):
    resp = client.post("/signup", json={"email": "no_user@example.com"})
    assert resp.status_code == 400
    error = resp.get_json()["error"].lower()
    assert "missing" in error or "required" in error


# -------------------------
# Expiry + revocation tests
# -------------------------


def test_expired_token_denied(client):
    client.post(
        "/signup",
        json={
            "username": "expireuser",
            "email": "expire@example.com",
            "password": "pw",
        },
    )
    login_resp = client.post(
        "/login", json={"email": "expire@example.com", "password": "pw"}
    )
    token = login_resp.get_json()["access_token"]

    # wait for expiry (config sets very short expiry in test env)
    time.sleep(2)

    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/protected", headers=headers)
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "Invalid or expired token"


def test_revoked_token_denied(client):
    client.post(
        "/signup",
        json={"username": "revoker", "email": "revoker@example.com", "password": "pw"},
    )
    login_resp = client.post(
        "/login", json={"email": "revoker@example.com", "password": "pw"}
    )
    token = login_resp.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # logout → token should be revoked
    client.delete("/logout", headers=headers)

    # attempt to reuse token
    resp = client.get("/protected", headers=headers)
    assert resp.status_code == 401
    # now normalized to one message
    assert resp.get_json()["error"] == "Invalid or expired token"
