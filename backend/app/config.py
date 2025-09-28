# backend/app/config.py
# Loads environment variables from .env
# Defaults provided for dev/testing

import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()


class Config:
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

    # CORS / other app configs
    FRONTEND_URL = os.getenv("REACT_APP_API_URL", "http://localhost:3000")


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {"connect_args": {"check_same_thread": False}}
    JWT_SECRET_KEY = "test-secret"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=1)
