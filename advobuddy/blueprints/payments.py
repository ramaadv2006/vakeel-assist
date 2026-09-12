"""Payment & Subscription Blueprint.

Implements all secure payment endpoints for order creation, Razorpay signature verification,
idempotent webhook handling, advocate plan status, and premium draft entitlement checks.
"""

import json
import logging
from functools import wraps
from flask import Blueprint, request, jsonify, g
from advobuddy.config import Config
from advobuddy.services.entitlement_service import EntitlementService
from advobuddy.services.razorpay_service import RazorpayService

logger = logging.getLogger(__name__)

payments_bp = Blueprint("payments", __name__, url_prefix="/api")

config = Config.from_env()
razorpay_service = RazorpayService(
    key_id=config.RAZORPAY_KEY_ID,
    key_secret=config.RAZORPAY_KEY_SECRET,
    webhook_secret=config.RAZORPAY_WEBHOOK_SECRET,
)

# Helper function placeholders that will be bound to app.get_db and _resolve_user_from_token
_get_db = None
_resolve_user_func = None

def init_payments_blueprint(get_db_func, resolve_user_func=None):
    global _get_db, _resolve_user_func
    _get_db = get_db_func
    _resolve_user_func = resolve_user_func


def require_auth(f):
    """Local authentication decorator referencing g.advocate_id or resolving Authorization Bearer token."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if getattr(g, "advocate_id", None):
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        token = auth_header[7:] if auth_header.startswith("Bearer ") else None
        if not token:
            return jsonify({"error": "Authentication required.", "code": "AUTHENTICATION_REQUIRED"}), 401

        if _resolve_user_func:
            advocate_id = _resolve_user_func(token)
            if advocate_id is None:
                return jsonify({"error": "Authentication required.", "code": "AUTHENTICATION_REQUIRED"}), 401
            g.advocate_id = advocate_id
            return f(*args, **kwargs)

        return jsonify({"error": "Authentication required.", "code": "AUTHENTICATION_REQUIRED"}), 401
    return wrapper


@payments_bp.route("/payments/plans", methods=["GET"])
def get_plans():
    """Returns all active plans and their feature descriptions for pricing displays."""
    conn = _get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT id, name, slug, description, price, currency, billing_interval, is_active
            FROM plans
            WHERE is_active = true
            ORDER BY price ASC
            """
        )
        plans = cur.fetchall()

        cur.execute("SELECT plan_id, feature_key, feature_value FROM plan_features")
        features = cur.fetchall()

        features_by_plan = {}
        for f in features:
            pid = f["plan_id"]
            features_by_plan.setdefault(pid, []).append(f["feature_key"])

        result = []
        for p in plans:
            p_dict = dict(p)
            p_dict["features"] = features_by_plan.get(p["id"], [])
            result.append(p_dict)

        return jsonify({"plans": result})
    finally:
        cur.close()
        conn.close()


@payments_bp.route("/payments/me", methods=["GET"])
@require_auth
def get_my_plan():
    """Returns the authenticated advocate's active plan, subscription, and entitlements."""
    advocate_id = g.advocate_id
    conn = _get_db()
    try:
        summary = EntitlementService.get_user_plan_summary(conn, advocate_id)
        return jsonify(summary)
    finally:
        conn.close()


@payments_bp.route("/payments/create-order", methods=["POST"])
@require_auth
def create_payment_order():
    """Creates a Razorpay order for the requested plan.

    Loads the authoritative price from the database and ignores any client-supplied amount.
    """
    advocate_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    plan_slug_or_id = data.get("plan_id") or data.get("plan_slug") or "pro"

    conn = _get_db()
    cur = conn.cursor()
    try:
        # 1. Query plan from DB
        if str(plan_slug_or_id).isdigit():
            cur.execute("SELECT * FROM plans WHERE id = %s", (int(plan_slug_or_id),))
        else:
            cur.execute("SELECT * FROM plans WHERE slug = %s", (str(plan_slug_or_id).lower(),))

        plan = cur.fetchone()
        if not plan:
            return jsonify({"error": "Invalid plan specified.", "code": "INVALID_PLAN"}), 400

        if not plan.get("is_active"):
            return jsonify({"error": "This plan is currently inactive.", "code": "INACTIVE_PLAN"}), 400

        if plan["price"] <= 0:
            return jsonify({"error": "Free plan does not require checkout order.", "code": "FREE_PLAN"}), 400

        # 2. Prevent redundant duplicate orders if user already has an active Pro subscription
        cur.execute(
            """
            SELECT id, end_date FROM subscriptions
            WHERE user_id = %s AND plan_id = %s AND status = 'active'
              AND (end_date IS NULL OR end_date > CURRENT_TIMESTAMP + INTERVAL '25 days')
            LIMIT 1
            """,
            (advocate_id, plan["id"]),
        )
        if cur.fetchone():
            return jsonify({
                "error": "You already have an active subscription for this plan.",
                "code": "ALREADY_SUBSCRIBED",
            }), 400

        # 3. Fetch advocate details for receipt and receipt generation
        cur.execute("SELECT name, email, phone FROM advocates WHERE id = %s", (advocate_id,))
        advocate = cur.fetchone() or {}

        # 4. Calculate amount strictly from database (in paise)
        amount_in_paise = int(plan["price"] * 100)
        currency = plan.get("currency") or "INR"
        receipt_id = f"rcpt_adv_{advocate_id}_{plan['id']}_{int(data.get('ts') or 0)}"[:40]
        if not receipt_id or receipt_id.endswith("_0"):
            receipt_id = f"rcpt_adv_{advocate_id}_{plan['id']}_{int(cur.connection.closed == False)}"

        # 5. Create order with Razorpay Gateway
        notes = {
            "advocate_id": str(advocate_id),
            "plan_id": str(plan["id"]),
            "plan_slug": plan["slug"],
        }
        rzp_order = razorpay_service.create_order(
            amount_in_paise=amount_in_paise,
            currency=currency,
            receipt=receipt_id,
            notes=notes,
        )
        razorpay_order_id = rzp_order["id"]

        # 6. Save in payment_orders table
        cur.execute(
            """
            INSERT INTO payment_orders (
                user_id, plan_id, razorpay_order_id, amount, currency, status, receipt
            )
            VALUES (%s, %s, %s, %s, %s, 'created', %s)
            RETURNING id
            """,
            (advocate_id, plan["id"], razorpay_order_id, amount_in_paise, currency, receipt_id),
        )
        conn.commit()

        return jsonify({
            "order_id": razorpay_order_id,
            "amount": amount_in_paise,
            "currency": currency,
            "key_id": razorpay_service.key_id,
            "plan_name": plan["name"],
            "plan_slug": plan["slug"],
            "user_name": advocate.get("name") or "",
            "user_email": advocate.get("email") or "",
            "user_phone": advocate.get("phone") or "",
        }), 201

    except Exception as e:
        conn.rollback()
        logger.error(f"Error in create_payment_order: {e}", exc_info=True)
        return jsonify({"error": f"Failed to create payment order: {str(e)}", "code": "ORDER_CREATION_FAILED"}), 500
    finally:
        cur.close()
        conn.close()


@payments_bp.route("/payments/verify", methods=["POST"])
@require_auth
def verify_payment():
    """Verifies Razorpay payment signature server-side and activates Pro entitlements."""
    advocate_id = g.advocate_id
    data = request.get_json(silent=True) or {}

    payment_id = (data.get("razorpay_payment_id") or "").strip()
    order_id = (data.get("razorpay_order_id") or "").strip()
    signature = (data.get("razorpay_signature") or "").strip()

    if not payment_id or not order_id or not signature:
        return jsonify({
            "error": "Missing payment verification parameters (payment_id, order_id, signature).",
            "code": "MISSING_PARAMETERS",
        }), 400

    conn = _get_db()
    cur = conn.cursor()
    try:
        # 1. Lookup local order
        cur.execute(
            "SELECT * FROM payment_orders WHERE razorpay_order_id = %s",
            (order_id,),
        )
        local_order = cur.fetchone()

        if not local_order:
            return jsonify({"error": "Payment order not found.", "code": "ORDER_NOT_FOUND"}), 404

        # 2. Verify ownership: Order must belong to authenticated advocate
        if local_order["user_id"] != advocate_id:
            logger.warning(
                f"Ownership mismatch: Advocate {advocate_id} attempted verifying order {order_id} belonging to user {local_order['user_id']}"
            )
            return jsonify({
                "error": "You are not authorized to verify this payment order.",
                "code": "ORDER_OWNERSHIP_MISMATCH",
            }), 403

        # 3. Check if order has already been verified and paid
        if local_order["status"] == "paid":
            return jsonify({
                "success": True,
                "message": "Payment already verified.",
                "code": "PAYMENT_ALREADY_PROCESSED",
            }), 200

        # 4. Verify cryptographic signature using server-stored order ID
        is_valid = razorpay_service.verify_payment_signature(
            razorpay_order_id=local_order["razorpay_order_id"],
            razorpay_payment_id=payment_id,
            razorpay_signature=signature,
        )

        if not is_valid:
            logger.error(f"Invalid Razorpay payment signature for order {order_id}")
            cur.execute(
                "UPDATE payment_orders SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (local_order["id"],),
            )
            conn.commit()
            return jsonify({"error": "Invalid payment signature.", "code": "INVALID_SIGNATURE"}), 400

        # 5. Record payment and update order status
        cur.execute(
            """
            INSERT INTO payments (
                user_id, plan_id, payment_order_id, razorpay_payment_id,
                razorpay_order_id, razorpay_signature, amount, currency, status, payment_method
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'captured', %s)
            ON CONFLICT (razorpay_payment_id) DO NOTHING
            RETURNING id
            """,
            (
                advocate_id,
                local_order["plan_id"],
                local_order["id"],
                payment_id,
                order_id,
                signature,
                local_order["amount"],
                local_order["currency"],
                data.get("payment_method") or "card",
            ),
        )

        cur.execute(
            "UPDATE payment_orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (local_order["id"],),
        )

        # 6. Grant Pro Plan entitlements
        EntitlementService.grant_plan_entitlements(
            conn=conn,
            user_id=advocate_id,
            plan_id_or_slug=local_order["plan_id"],
            duration_days=30,
        )
        conn.commit()

        # 7. Return refreshed plan summary
        plan_summary = EntitlementService.get_user_plan_summary(conn, advocate_id)
        return jsonify({
            "success": True,
            "message": "Payment verified successfully! Pro plan features unlocked.",
            "plan_summary": plan_summary,
        }), 200

    except Exception as e:
        conn.rollback()
        logger.error(f"Payment verification failed: {e}", exc_info=True)
        return jsonify({"error": f"Payment verification error: {str(e)}", "code": "PAYMENT_PROCESSING_ERROR"}), 500
    finally:
        cur.close()
        conn.close()


@payments_bp.route("/payments/webhook", methods=["POST"])
def razorpay_webhook():
    """Handles asynchronous lifecycle webhooks from Razorpay with strict idempotency."""
    signature = request.headers.get("X-Razorpay-Signature", "")
    raw_payload = request.get_data()

    if not signature:
        return jsonify({"error": "Missing webhook signature.", "code": "MISSING_SIGNATURE"}), 400

    # 1. Validate webhook signature
    is_valid = razorpay_service.verify_webhook_signature(raw_payload, signature)
    if not is_valid:
        logger.warning("Rejected Razorpay webhook with invalid signature")
        return jsonify({"error": "Invalid webhook signature.", "code": "INVALID_WEBHOOK_SIGNATURE"}), 400

    payload_data = request.get_json(silent=True) or {}
    event_id = payload_data.get("event_id") or payload_data.get("id") or ""
    event_type = payload_data.get("event") or ""

    if not event_id:
        import hashlib
        event_id = f"evt_{hashlib.sha256(raw_payload).hexdigest()[:24]}"

    conn = _get_db()
    cur = conn.cursor()
    try:
        # 2. Check for duplicate webhook processing (Idempotency)
        cur.execute("SELECT id FROM webhook_events WHERE event_id = %s", (event_id,))
        if cur.fetchone():
            logger.info(f"Duplicate webhook event {event_id} received. Skipping processing.")
            return jsonify({"status": "already_processed", "event_id": event_id}), 200

        # Record webhook event
        cur.execute(
            """
            INSERT INTO webhook_events (event_id, event_type, payload)
            VALUES (%s, %s, %s)
            ON CONFLICT (event_id) DO NOTHING
            """,
            (event_id, event_type, json.dumps(payload_data)),
        )
        conn.commit()

        # 3. Process event types
        if event_type in ["payment.captured", "order.paid"]:
            payment_entity = payload_data.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id") or payload_data.get("payload", {}).get("order", {}).get("entity", {}).get("id")
            payment_id = payment_entity.get("id")

            if order_id:
                cur.execute("SELECT * FROM payment_orders WHERE razorpay_order_id = %s", (order_id,))
                local_order = cur.fetchone()
                if local_order and local_order["status"] != "paid":
                    cur.execute(
                        "UPDATE payment_orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (local_order["id"],),
                    )
                    if payment_id:
                        cur.execute(
                            """
                            INSERT INTO payments (
                                user_id, plan_id, payment_order_id, razorpay_payment_id,
                                razorpay_order_id, amount, currency, status, payment_method
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, 'captured', %s)
                            ON CONFLICT (razorpay_payment_id) DO NOTHING
                            """,
                            (
                                local_order["user_id"],
                                local_order["plan_id"],
                                local_order["id"],
                                payment_id,
                                order_id,
                                local_order["amount"],
                                local_order["currency"],
                                payment_entity.get("method") or "webhook",
                            ),
                        )
                    EntitlementService.grant_plan_entitlements(
                        conn=conn,
                        user_id=local_order["user_id"],
                        plan_id_or_slug=local_order["plan_id"],
                        duration_days=30,
                    )
                    conn.commit()

        elif event_type == "payment.failed":
            payment_entity = payload_data.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            if order_id:
                cur.execute(
                    "UPDATE payment_orders SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE razorpay_order_id = %s AND status != 'paid'",
                    (order_id,),
                )
                conn.commit()

        elif event_type in ["subscription.cancelled", "subscription.halted"]:
            sub_entity = payload_data.get("payload", {}).get("subscription", {}).get("entity", {})
            customer_id = sub_entity.get("customer_id")
            if customer_id:
                cur.execute("SELECT user_id FROM subscriptions WHERE razorpay_customer_id = %s", (customer_id,))
                sub_record = cur.fetchone()
                if sub_record:
                    EntitlementService.revoke_plan_entitlements(conn, sub_record["user_id"])
                    conn.commit()

        return jsonify({"status": "processed", "event_id": event_id}), 200

    except Exception as e:
        conn.rollback()
        logger.error(f"Webhook processing error: {e}", exc_info=True)
        return jsonify({"error": f"Webhook processing error: {str(e)}"}), 500
    finally:
        cur.close()
        conn.close()


@payments_bp.route("/drafts/generate", methods=["POST"])
@require_auth
def generate_draft():
    """Generates legal draft content after verifying user feature entitlement.

    Rejects unauthorized access with HTTP 403 PREMIUM_FEATURE_REQUIRED.
    """
    advocate_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    template_id = (data.get("template_id") or "").strip()
    draft_data = data.get("data") or {}

    if not template_id:
        return jsonify({"error": "Template ID is required."}), 400

    feature_key = f"draft.{template_id}"
    conn = _get_db()
    try:
        # Check entitlement via EntitlementService
        has_access = EntitlementService.has_access(conn, advocate_id, feature_key)
        if not has_access:
            return jsonify({
                "error": "PREMIUM_FEATURE_REQUIRED",
                "feature": feature_key,
                "upgrade_required": True,
                "message": "This professional legal draft is exclusively available on Vakeel Assist Pro.",
            }), 403

        return jsonify({
            "success": True,
            "template_id": template_id,
            "data": draft_data,
            "verified": True,
        }), 200
    finally:
        conn.close()
