"""Tests for Studio backend cross-origin guardrails."""

from fastapi.testclient import TestClient

from studio.backend.main import STUDIO_TOKEN_HEADER, app


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


def test_mutating_request_requires_token_when_configured(monkeypatch):
    monkeypatch.setenv("MNEMION_STUDIO_TOKEN", "secret-token")
    client = TestClient(app)

    response = client.post("/api/drawer", json={})

    assert response.status_code == 403
    assert response.json() == {"detail": "Forbidden"}


def test_mutating_request_rejects_wrong_token(monkeypatch):
    monkeypatch.setenv("MNEMION_STUDIO_TOKEN", "secret-token")
    client = TestClient(app)

    response = client.post(
        "/api/drawer",
        json={},
        headers={STUDIO_TOKEN_HEADER: "wrong-token"},
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Forbidden"}


def test_mutating_request_with_valid_token_reaches_endpoint_validation(monkeypatch):
    monkeypatch.setenv("MNEMION_STUDIO_TOKEN", "secret-token")
    client = TestClient(app)

    response = client.post(
        "/api/drawer",
        json={},
        headers={STUDIO_TOKEN_HEADER: "secret-token"},
    )

    assert response.status_code == 422


def test_read_only_request_does_not_require_token(monkeypatch):
    monkeypatch.setenv("MNEMION_STUDIO_TOKEN", "secret-token")
    client = TestClient(app)

    response = client.get("/api/docs")

    assert response.status_code == 200


def test_cors_preflight_does_not_require_token(monkeypatch):
    monkeypatch.setenv("MNEMION_STUDIO_TOKEN", "secret-token")

    response = _preflight("http://localhost:5173")

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
