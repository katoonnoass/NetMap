"""Pytest configuration and fixtures for NetMap tests."""

import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from app import create_app
from app.config import Config

TEST_ADMIN_PASSWORD = "AdminTest@12345"


@pytest.fixture
def app():
    with tempfile.TemporaryDirectory(prefix="netmap_test_") as data_dir_str:
        data_dir = Path(data_dir_str)
        projects_dir = data_dir / "projects"
        projects_dir.mkdir(parents=True, exist_ok=True)

        class TestConfig(Config):
            TESTING = True
            WTF_CSRF_ENABLED = False
            DATABASE_URL = ""
            DEFAULT_ADMIN_PASSWORD = TEST_ADMIN_PASSWORD
            DATA_DIR = data_dir
            USERS_FILE = data_dir / "users.json"
            PROJECTS_DIR = projects_dir
            AUDIT_FILE = data_dir / "audit_log.json"
            IXC_CONFIG_FILE = data_dir / "ixc_integration.json"

        yield create_app(TestConfig)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_client(client):
    client.post(
        "/api/auth/login",
        json={"username": "admin", "password": TEST_ADMIN_PASSWORD},
    )
    return client
