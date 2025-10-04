# File: backend/app/config.py
# Purpose: Flask configuration for all environments (Dev, Test, Prod)
# Notes:
# - Dynamically adapts between Docker and local environments.
# - Ensures correct DB host resolution (db vs localhost).
# - Uses Postgres for both development and testing environments.
# - Includes safety checks for missing or misconfigured .env variables.

import os
from dotenv import load_dotenv, find_dotenv
from datetime import timedelta


# ------------------------
# Helper Functions
# ------------------------
def normalize_host(url: str) -> str:
    """Normalize database hostname for local environments.

    Converts any Docker hostname reference (e.g., '@db' or '://db:')
    into localhost equivalents. This ensures the same .env file
    works both inside and outside Docker.
    """
    if not url:
        return url

    return (
        url.replace("@db:", "@localhost:")
           .replace("@db/", "@localhost/")
           .replace("://db:", "://localhost:")
    )


def detect_database_url() -> str:
    """Resolve database URL dynamically for Docker vs local."""
    load_dotenv(find_dotenv())

    # Read from environment
    db_url = os.getenv("DATABASE_URL")

    # Fallback to safe local default if missing or misformatted
    if not db_url or db_url.startswith("${"):
        db_url = "postgresql://postgres:postgres@localhost:5432/heroleague"

    # If running inside Docker, return as-is
    if os.getenv("DOCKER_ENV", "false").lower() == "true":
        return db_url

    # Otherwise, normalize to localhost
    return normalize_host(db_url)


# ------------------------
# Base Configuration
# ------------------------
class Config:
    """Base configuration shared across all environments."""

    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = detect_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_TYPE = "Bearer"
    JWT_ALGORITHM = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)

    # CORS / Frontend
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # External API
    SUPERHERO_API_KEY = os.getenv("API_KEY", "demo-key")


# ------------------------
# Development Configuration
# ------------------------
class DevConfig(Config):
    """Used for local development."""
    DEBUG = True


# ------------------------
# Testing Configuration
# ------------------------
class TestConfig(Config):
    """Used during pytest / CI — connects to dedicated Postgres test DB."""
    TESTING = True

    # Load test database URL from env
    test_url = os.getenv("TEST_DATABASE_URL")

    # Fallback to local if not set or invalid
    if not test_url or test_url.startswith("${"):
        test_url = "postgresql://postgres:postgres@localhost:5432/heroleague_test"

    # Normalize hostname when NOT running inside Docker
    if os.getenv("DOCKER_ENV", "false").lower() != "true":
        test_url = normalize_host(test_url)

    SQLALCHEMY_DATABASE_URI = test_url

    # JWT test settings
    JWT_SECRET_KEY = "test-secret"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=2)

    # Use test API key to avoid external dependencies
    SUPERHERO_API_KEY = "test-key"
