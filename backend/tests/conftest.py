"""
Tests package — configure pytest fixtures here.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Synchronous FastAPI test client."""
    with TestClient(app) as c:
        yield c
