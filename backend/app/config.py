# File: backend/app/config.py
# Purpose: Flask configuration for all environments (Dev, Test, Prod)
# Notes:
# - Dynamically adapts between Docker and local environments.
# - Ensures correct DB host resolution (db vs localhost).
# - Uses Postgres for both dev and test environments.

import os
from dotenv import load_dotenv, find_dotenv
from datetime import timedelta


# ------------------------
# ENVIRONMENT DETECTION
# ------------------------
def detect_database_url():
    """Resolve database URL dynamically for Docker vs local."""
    load_dotenv(find_dotenv())

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is required")

    # Inside Docker
    if os.getenv("DOCKER_ENV", "false").lower() == "true":
        return db_url

    # Outside Docker → swap @db for @localhost if present
    return db_url.replace("@db:", "@localhost:")


# ------------------------
# CONFIG CLASSES
# ------------------------
class Config:
    """Base configuration shared across all environments."""

    SQLALCHEMY_DATABASE_URI = detect_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key")
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_TYPE = "Bearer"
    JWT_ALGORITHM = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)

    # CORS / Frontend
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # External API
    SUPERHERO_API_KEY = os.getenv("API_KEY", "demo-key")


class DevConfig(Config):
    """Used for local development."""
    DEBUG = True


class TestConfig(Config):
    """Used during pytest / CI — connects to dedicated Postgres test DB."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/heroleague_test",
    )
    JWT_SECRET_KEY = "test-secret"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=2)
    SUPERHERO_API_KEY = "test-key"
