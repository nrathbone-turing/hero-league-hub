# File: backend/app/config.py
# Purpose: Flask configuration for all environments (Dev, Test, Prod)
# Notes:
# - Uses Postgres for both dev and test environments (no SQLite fallback).
# - TestConfig uses TEST_DATABASE_URL for isolated test DB.
# - JWT + API key defaults for test speed and CI consistency.

import os
from dotenv import load_dotenv, find_dotenv
from datetime import timedelta

# Load .env only if running outside Docker (local dev)
if not os.getenv("DATABASE_URL"):
    load_dotenv(find_dotenv())


class Config:
    """Base configuration shared across all environments."""

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    if not SQLALCHEMY_DATABASE_URI:
        raise ValueError("DATABASE_URL environment variable is required")

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
        "postgresql://postgres:postgres@db:5432/heroleague_test"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Faster test cycles
    JWT_SECRET_KEY = "test-secret"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=2)
    SUPERHERO_API_KEY = "test-key"
