"""Comprehensive Test Suite for Payments, Razorpay Verification, Webhooks, and Entitlements.

Covers all 20 required test scenarios defined in Section 23 of the specification:
 1. create order authenticated
 2. create order unauthenticated
 3. invalid plan
 4. inactive plan
 5. frontend amount tampering prevention
 6. valid payment signature verification
 7. invalid payment signature rejection
 8. wrong order ownership rejection
 9. duplicate payment verification idempotency
10. webhook signature validation
11. duplicate webhook event idempotency
12. premium draft without entitlement (403)
13. premium draft with entitlement (200)
14. expired entitlement revocation
15. cancelled subscription revocation
16. payment failure webhook handling
17. payment success workflow end-to-end
18. existing free user status
19. pro user status
20. cross-user order verification attempt prevention
"""

import hashlib
import hmac
import json
import time
import pytest
from app import app, get_db
from advobuddy.services.entitlement_service import EntitlementService
from advobuddy.services.razorpay_service import RazorpayService


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def db_conn():
    conn = get_db()
    yield conn
    conn.close()


@pytest.fixture(scope="session", autouse=True)
def seed_test_advocates():
    """Ensure test advocate records (IDs 1-50) exist once for the entire test session."""
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO advocates (id, name, email, role)
        SELECT s, 'Test Advocate ' || s, 'test_advocate_' || s || '@vakeelassist.test', 'advocate'
        FROM generate_series(1, 50) s
        ON CONFLICT (id) DO NOTHING;
        DELETE FROM entitlements WHERE user_id BETWEEN 1 AND 50;
        DELETE FROM payments WHERE user_id BETWEEN 1 AND 50;
        DELETE FROM subscriptions WHERE user_id BETWEEN 1 AND 50;
        DELETE FROM payment_orders WHERE user_id BETWEEN 1 AND 50;
        """
    )
    conn.commit()
    cur.close()
    conn.close()


def generate_test_signature(secret: str, order_id: str, payment_id: str) -> str:
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def generate_webhook_signature(secret: str, raw_payload: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), raw_payload, hashlib.sha256).hexdigest()


# ----------------------------------------------------------------------
# 1. Create Order Authenticated
# ----------------------------------------------------------------------
def test_create_order_authenticated(client):
    res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "pro"},
        headers={"Authorization": "Bearer dev-token-1"},
    )
    assert res.status_code in [201, 400]  # 201 if fresh, 400 if already subscribed
    if res.status_code == 201:
        data = res.get_json()
        assert "order_id" in data
        assert data["amount"] == 49900
        assert data["currency"] == "INR"
        assert "key_id" in data


# ----------------------------------------------------------------------
# 2. Create Order Unauthenticated (401)
# ----------------------------------------------------------------------
def test_create_order_unauthenticated(client):
    res = client.post("/api/payments/create-order", json={"plan_id": "pro"})
    assert res.status_code == 401
    assert "error" in res.get_json()


# ----------------------------------------------------------------------
# 3. Invalid Plan (400)
# ----------------------------------------------------------------------
def test_create_order_invalid_plan(client):
    res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "non_existent_plan_xyz"},
        headers={"Authorization": "Bearer dev-token-2"},
    )
    assert res.status_code == 400
    assert res.get_json().get("code") == "INVALID_PLAN"


# ----------------------------------------------------------------------
# 4. Inactive Plan (400)
# ----------------------------------------------------------------------
def test_create_order_inactive_plan(client, db_conn):
    cur = db_conn.cursor()
    cur.execute(
        """
        INSERT INTO plans (name, slug, description, price, is_active)
        VALUES ('Archived Plan', 'archived_plan', 'Inactive', 999, false)
        ON CONFLICT (slug) DO UPDATE SET is_active = false
        RETURNING id
        """
    )
    db_conn.commit()
    cur.close()

    res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "archived_plan"},
        headers={"Authorization": "Bearer dev-token-2"},
    )
    assert res.status_code == 400
    assert res.get_json().get("code") == "INACTIVE_PLAN"


# ----------------------------------------------------------------------
# 5. Frontend Amount Tampering Prevention
# ----------------------------------------------------------------------
def test_frontend_amount_tampering_ignored(client):
    # Attempt passing 1 INR instead of 499 INR
    res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "pro", "amount": 100},
        headers={"Authorization": "Bearer dev-token-3"},
    )
    if res.status_code == 201:
        data = res.get_json()
        assert data["amount"] == 49900  # Strictly 49900 paise computed from DB price


# ----------------------------------------------------------------------
# 6. Valid Payment Signature Verification
# ----------------------------------------------------------------------
def test_valid_payment_signature_verification(client, db_conn):
    user_id = 4
    # Ensure any previous subscription revoked
    EntitlementService.revoke_plan_entitlements(db_conn, user_id)
    db_conn.commit()

    # Create order
    create_res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "pro"},
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert create_res.status_code == 201
    order_data = create_res.get_json()
    order_id = order_data["order_id"]

    payment_id = f"pay_test_{int(time.time())}"
    secret = app.config.get("RAZORPAY_KEY_SECRET") or "placeholder_secret"
    valid_sig = generate_test_signature(secret, order_id, payment_id)

    verify_res = client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_sig,
        },
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert verify_res.status_code == 200
    assert verify_res.get_json()["success"] is True

    # Confirm entitlement is active
    assert EntitlementService.has_access(db_conn, user_id, "draft.bail_app") is True
    assert EntitlementService.has_access(db_conn, user_id, "draft.suretyship_app") is True


# ----------------------------------------------------------------------
# 7. Invalid Payment Signature Rejection (400)
# ----------------------------------------------------------------------
def test_invalid_payment_signature_rejection(client):
    user_id = 5
    create_res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "pro"},
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert create_res.status_code == 201
    order_id = create_res.get_json()["order_id"]

    verify_res = client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_fake_123",
            "razorpay_signature": "invalid_bogus_signature_abc",
        },
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert verify_res.status_code == 400
    assert verify_res.get_json().get("code") == "INVALID_SIGNATURE"


# ----------------------------------------------------------------------
# 8. Wrong Order Ownership Rejection (403)
# ----------------------------------------------------------------------
def test_wrong_order_ownership_rejection(client):
    # User 10 creates order
    user_a = 10
    user_b = 11

    create_res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "pro"},
        headers={"Authorization": f"Bearer dev-token-{user_a}"},
    )
    assert create_res.status_code == 201
    order_id = create_res.get_json()["order_id"]

    # User 11 attempts to verify User 10's order
    secret = app.config.get("RAZORPAY_KEY_SECRET") or "placeholder_secret"
    sig = generate_test_signature(secret, order_id, "pay_shared_123")

    verify_res = client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_shared_123",
            "razorpay_signature": sig,
        },
        headers={"Authorization": f"Bearer dev-token-{user_b}"},
    )
    assert verify_res.status_code == 403
    assert verify_res.get_json().get("code") == "ORDER_OWNERSHIP_MISMATCH"


# ----------------------------------------------------------------------
# 9. Duplicate Payment Verification Idempotency
# ----------------------------------------------------------------------
def test_duplicate_payment_verification_idempotency(client, db_conn):
    user_id = 12
    EntitlementService.revoke_plan_entitlements(db_conn, user_id)
    db_conn.commit()
    create_res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "pro"},
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert create_res.status_code == 201
    order_id = create_res.get_json()["order_id"]
    payment_id = f"pay_dup_{int(time.time())}"

    secret = app.config.get("RAZORPAY_KEY_SECRET") or "placeholder_secret"
    sig = generate_test_signature(secret, order_id, payment_id)

    payload = {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": sig,
    }

    # First verification
    res1 = client.post(
        "/api/payments/verify",
        json=payload,
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert res1.status_code == 200

    # Second (duplicate) verification should succeed safely without creating multiple subscriptions
    res2 = client.post(
        "/api/payments/verify",
        json=payload,
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert res2.status_code == 200
    assert res2.get_json().get("code") == "PAYMENT_ALREADY_PROCESSED" or res2.get_json().get("success") is True


# ----------------------------------------------------------------------
# 10. Webhook Signature Validation
# ----------------------------------------------------------------------
def test_webhook_signature_validation(client):
    webhook_secret = app.config.get("RAZORPAY_WEBHOOK_SECRET") or "placeholder_webhook_secret"
    payload = json.dumps({"event": "payment.captured", "id": f"evt_test_{int(time.time())}"}).encode("utf-8")
    valid_sig = generate_webhook_signature(webhook_secret, payload)

    # Valid signature
    res_valid = client.post(
        "/api/payments/webhook",
        data=payload,
        headers={"X-Razorpay-Signature": valid_sig, "Content-Type": "application/json"},
    )
    assert res_valid.status_code == 200

    # Invalid signature
    res_invalid = client.post(
        "/api/payments/webhook",
        data=payload,
        headers={"X-Razorpay-Signature": "invalid_webhook_sig", "Content-Type": "application/json"},
    )
    assert res_invalid.status_code == 400
    assert res_invalid.get_json().get("code") == "INVALID_WEBHOOK_SIGNATURE"


# ----------------------------------------------------------------------
# 11. Duplicate Webhook Event Idempotency
# ----------------------------------------------------------------------
def test_duplicate_webhook_idempotency(client):
    webhook_secret = app.config.get("RAZORPAY_WEBHOOK_SECRET") or "placeholder_webhook_secret"
    event_id = f"evt_idemp_{int(time.time())}_{hashlib.md5(b'test').hexdigest()[:6]}"
    payload = json.dumps({"event": "payment.captured", "id": event_id}).encode("utf-8")
    valid_sig = generate_webhook_signature(webhook_secret, payload)

    headers = {"X-Razorpay-Signature": valid_sig, "Content-Type": "application/json"}

    res1 = client.post("/api/payments/webhook", data=payload, headers=headers)
    assert res1.status_code == 200

    res2 = client.post("/api/payments/webhook", data=payload, headers=headers)
    assert res2.status_code == 200
    assert res2.get_json().get("status") == "already_processed"


# ----------------------------------------------------------------------
# 12. Premium Draft without Entitlement (HTTP 403)
# ----------------------------------------------------------------------
def test_premium_draft_without_entitlement(client, db_conn):
    free_user_id = 20
    EntitlementService.revoke_plan_entitlements(db_conn, free_user_id)
    db_conn.commit()

    res = client.post(
        "/api/drafts/generate",
        json={"template_id": "bail_app", "data": {"court": "High Court"}},
        headers={"Authorization": f"Bearer dev-token-{free_user_id}"},
    )
    assert res.status_code == 403
    data = res.get_json()
    assert data["error"] == "PREMIUM_FEATURE_REQUIRED"
    assert data["feature"] == "draft.bail_app"
    assert data["upgrade_required"] is True


# ----------------------------------------------------------------------
# 13. Premium Draft with Entitlement (HTTP 200)
# ----------------------------------------------------------------------
def test_premium_draft_with_entitlement(client, db_conn):
    pro_user_id = 21
    EntitlementService.grant_plan_entitlements(db_conn, pro_user_id, "pro", duration_days=30)
    db_conn.commit()

    res = client.post(
        "/api/drafts/generate",
        json={"template_id": "bail_app", "data": {"court": "High Court"}},
        headers={"Authorization": f"Bearer dev-token-{pro_user_id}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["verified"] is True


# ----------------------------------------------------------------------
# 14. Expired Entitlement Revocation
# ----------------------------------------------------------------------
def test_expired_entitlement_revocation(db_conn):
    user_id = 22
    # Set entitlement with expired date in past
    cur = db_conn.cursor()
    cur.execute(
        """
        INSERT INTO entitlements (user_id, feature_key, source, status, starts_at, expires_at)
        VALUES (%s, 'draft.suretyship_app', 'subscription', 'active', CURRENT_TIMESTAMP - INTERVAL '40 days', CURRENT_TIMESTAMP - INTERVAL '10 days')
        ON CONFLICT (user_id, feature_key, source) DO UPDATE
        SET status = 'active', expires_at = CURRENT_TIMESTAMP - INTERVAL '10 days'
        """,
        (user_id,),
    )
    db_conn.commit()
    cur.close()

    assert EntitlementService.has_access(db_conn, user_id, "draft.suretyship_app") is False


# ----------------------------------------------------------------------
# 15. Cancelled Subscription Revocation
# ----------------------------------------------------------------------
def test_cancelled_subscription_revocation(db_conn):
    user_id = 23
    EntitlementService.grant_plan_entitlements(db_conn, user_id, "pro", duration_days=30)
    db_conn.commit()
    assert EntitlementService.has_access(db_conn, user_id, "draft.bail_app") is True

    # Revoke/Cancel
    EntitlementService.revoke_plan_entitlements(db_conn, user_id)
    db_conn.commit()
    assert EntitlementService.has_access(db_conn, user_id, "draft.bail_app") is False


# ----------------------------------------------------------------------
# 16. Payment Failure Webhook Handling
# ----------------------------------------------------------------------
def test_payment_failure_webhook_handling(client, db_conn):
    user_id = 24
    create_res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "pro"},
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert create_res.status_code == 201
    order_id = create_res.get_json()["order_id"]

    webhook_secret = app.config.get("RAZORPAY_WEBHOOK_SECRET") or "placeholder_webhook_secret"
    payload = json.dumps({
        "event": "payment.failed",
        "id": f"evt_fail_{int(time.time())}",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_failed_test",
                    "order_id": order_id,
                }
            }
        }
    }).encode("utf-8")
    sig = generate_webhook_signature(webhook_secret, payload)

    res = client.post(
        "/api/payments/webhook",
        data=payload,
        headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"},
    )
    assert res.status_code == 200

    # Verify order is marked as failed
    cur = db_conn.cursor()
    cur.execute("SELECT status FROM payment_orders WHERE razorpay_order_id = %s", (order_id,))
    order_row = cur.fetchone()
    cur.close()
    assert order_row["status"] == "failed"


# ----------------------------------------------------------------------
# 17. Payment Success Workflow End-to-End
# ----------------------------------------------------------------------
def test_payment_success_workflow_end_to_end(client, db_conn):
    user_id = 25
    EntitlementService.revoke_plan_entitlements(db_conn, user_id)
    db_conn.commit()

    # Step 1: Create Order
    create_res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "pro"},
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert create_res.status_code == 201
    order_id = create_res.get_json()["order_id"]

    # Step 2: Verify Payment
    payment_id = f"pay_e2e_{int(time.time())}"
    secret = app.config.get("RAZORPAY_KEY_SECRET") or "placeholder_secret"
    sig = generate_test_signature(secret, order_id, payment_id)

    verify_res = client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
        },
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert verify_res.status_code == 200

    # Step 3: Check /api/payments/me
    me_res = client.get(
        "/api/payments/me",
        headers={"Authorization": f"Bearer dev-token-{user_id}"},
    )
    assert me_res.status_code == 200
    me_data = me_res.get_json()
    assert me_data["plan"]["slug"] == "pro"
    assert me_data["is_pro"] is True
    assert "draft.bail_app" in me_data["entitlements"]
    assert "draft.suretyship_app" in me_data["entitlements"]


# ----------------------------------------------------------------------
# 18. Existing Free User Status
# ----------------------------------------------------------------------
def test_existing_free_user_status(client, db_conn):
    free_user_id = 26
    EntitlementService.revoke_plan_entitlements(db_conn, free_user_id)
    db_conn.commit()

    res = client.get(
        "/api/payments/me",
        headers={"Authorization": f"Bearer dev-token-{free_user_id}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["plan"]["slug"] == "free"
    assert data["is_pro"] is False
    assert data["subscription"] is None
    assert "draft.basic" in data["entitlements"]
    assert "draft.bail_app" not in data["entitlements"]


# ----------------------------------------------------------------------
# 19. Pro User Status
# ----------------------------------------------------------------------
def test_pro_user_status(client, db_conn):
    pro_user_id = 27
    EntitlementService.grant_plan_entitlements(db_conn, pro_user_id, "pro", duration_days=30)
    db_conn.commit()

    res = client.get(
        "/api/payments/me",
        headers={"Authorization": f"Bearer dev-token-{pro_user_id}"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["plan"]["slug"] == "pro"
    assert data["is_pro"] is True
    assert data["subscription"]["status"] == "active"
    assert "draft.bail_app" in data["entitlements"]
    assert "draft.suretyship_app" in data["entitlements"]


# ----------------------------------------------------------------------
# 20. Cross-User Order Verification Attempt Prevention
# ----------------------------------------------------------------------
def test_cross_user_order_verification_prevention(client):
    user_owner = 28
    user_attacker = 29

    create_res = client.post(
        "/api/payments/create-order",
        json={"plan_id": "pro"},
        headers={"Authorization": f"Bearer dev-token-{user_owner}"},
    )
    assert create_res.status_code == 201
    order_id = create_res.get_json()["order_id"]

    secret = app.config.get("RAZORPAY_KEY_SECRET") or "placeholder_secret"
    sig = generate_test_signature(secret, order_id, "pay_cross_attempt")

    # Attacker tries to submit verification for victim's order
    attack_res = client.post(
        "/api/payments/verify",
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_cross_attempt",
            "razorpay_signature": sig,
        },
        headers={"Authorization": f"Bearer dev-token-{user_attacker}"},
    )
    assert attack_res.status_code == 403
    assert attack_res.get_json()["code"] == "ORDER_OWNERSHIP_MISMATCH"
