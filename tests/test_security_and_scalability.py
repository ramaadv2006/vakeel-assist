import io
import time
import pytest
from PIL import Image
from app import app, _AUTH_TOKEN_CACHE, _AUTH_TOKEN_CACHE_LOCK
from advobuddy.ecourts import _SESSION_STORE, start_ecourts_search, refresh_ecourts_captcha, submit_ecourts_captcha


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_security_headers_present(client):
    """Ensure standard defensive HTTP security headers are injected into every response."""
    response = client.get("/api/courts/districts")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_cors_headers(client):
    """Ensure CORS headers respect configured origins."""
    response = client.get(
        "/api/courts/districts",
        headers={"Origin": "http://localhost:5173"}
    )
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


def test_ecourts_session_store_lifecycle():
    """Verify SessionStore stores, retrieves, and updates eCourts session state correctly."""
    result = start_ecourts_search("MS/1234/2020", state="TN", district="01")
    assert "sessionId" in result
    session_id = result["sessionId"]

    # Verify session exists in SessionStore
    sess = _SESSION_STORE.get(session_id)
    assert sess is not None
    assert sess["bar_number"] == "MS/1234/2020"
    assert sess["state"] == "TN"

    # Refresh captcha
    refreshed = refresh_ecourts_captcha(session_id)
    assert refreshed["status"] == "captcha_refreshed"

    # Submit invalid captcha -> retry
    retry_res = submit_ecourts_captcha(session_id, "WRONG_CAPTCHA")
    assert retry_res["status"] == "retry"

    # Fetch updated captcha and submit correctly
    curr_sess = _SESSION_STORE.get(session_id)
    correct_code = curr_sess["captcha_text"]
    success_res = submit_ecourts_captcha(session_id, correct_code)
    assert success_res["status"] == "success"
    assert len(success_res["cases"]) > 0


def test_unauthenticated_api_endpoints_reject_without_token(client):
    """Ensure protected API routes return 401 when Authorization header is missing."""
    protected_endpoints = [
        "/api/dashboard",
        "/api/cases",
        "/api/settings",
        "/api/tasks",
        "/api/billing",
        "/api/chat",
        "/api/analyze-case",
        "/api/student/dashboard",
    ]
    for endpoint in protected_endpoints:
        res = client.get(endpoint) if endpoint not in ["/api/cases", "/api/chat", "/api/analyze-case"] else client.post(endpoint)
        assert res.status_code == 401, f"Endpoint {endpoint} was not protected (returned {res.status_code})"
        json_data = res.get_json()
        assert "error" in json_data


def test_avatar_upload_security_validation(client):
    """Test avatar upload rejects non-image binaries and unauthenticated requests."""
    corrupted_data = {
        "profile_image": (io.BytesIO(b"<?php echo 'malicious script'; ?>"), "shell.png")
    }

    res = client.post(
        "/api/settings/avatar",
        data=corrupted_data,
        content_type="multipart/form-data"
    )
    # Should reject with 401 (since unauthenticated) or 400 (if corrupted)
    assert res.status_code in [400, 401]


def test_rate_limiter_blocks_excessive_traffic(client):
    """Verify Flask-Limiter throttles abusive traffic on sensitive endpoints."""
    rate_limited = False
    for _ in range(30):
        res = client.post("/api/ecourts/start-search", json={"barNumber": "MS/9999/2021"})
        if res.status_code == 429:
            rate_limited = True
            json_data = res.get_json()
            assert "Rate limit exceeded" in json_data.get("error", "")
            break

    assert rate_limited, "Rate limiter did not throttle requests after 30 calls"


def test_court_metadata_and_taxonomy_endpoints(client):
    """Verify public court metadata and complex queries return valid structure."""
    res_dist = client.get("/api/courts/districts")
    assert res_dist.status_code == 200
    assert "districts" in res_dist.get_json()
    assert len(res_dist.get_json()["districts"]) > 0

    res_types = client.get("/api/courts/types")
    assert res_types.status_code == 200
    assert "court_types" in res_types.get_json()

    res_comp = client.get("/api/courts/complexes/Chennai")
    assert res_comp.status_code == 200
    assert res_comp.get_json()["district"] == "Chennai"

    res_meta = client.get("/api/ecourts/meta")
    assert res_meta.status_code == 200
    meta_json = res_meta.get_json()
    assert "states" in meta_json
    assert "caseTypeCategories" in meta_json


def test_spa_frontend_serving(client):
    """Verify Flask serves built React SPA index.html for root and client routes."""
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert b"<!doctype html>" in res_root.data.lower() or b"<html" in res_root.data.lower()

    res_spa_route = client.get("/dashboard")
    assert res_spa_route.status_code == 200
    assert b"<!doctype html>" in res_spa_route.data.lower() or b"<html" in res_spa_route.data.lower()


def test_api_404_json_format(client):
    """Verify unknown API endpoints return structured JSON error instead of raw HTML."""
    res = client.get("/api/nonexistent-endpoint-test-12345")
    assert res.status_code == 404
    json_data = res.get_json()
    assert json_data is not None
    assert "error" in json_data
    assert json_data["status"] == 404

