"""Tests for Studio backend cross-origin guardrails."""

from fastapi.testclient import TestClient

from studio.backend.main import app


def _preflight(origin: str, method: str = "POST"):
    client = TestClient(app)
    return client.options(
        "/api/drawer",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": method,
        },
    )


def test_cors_allows_vite_dev_origin():
    response = _preflight("http://localhost:5173")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_cors_rejects_unexpected_localhost_port():
    response = _preflight("http://localhost:9999")

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_cors_allows_electron_file_origin():
    response = _preflight("file://")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "file://"
