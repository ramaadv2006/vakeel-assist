"""Entitlement & Subscription Management Service.

Central decision point for all user feature permissions, plan entitlements,
and subscription lifecycles.
"""

from datetime import datetime, timezone


FREE_PLAN_DEFAULT_FEATURES = {
    "draft.basic",
    "ai.basic",
}

# Explicit mapping of existing premium drafts for fast reference
PREMIUM_DRAFT_1 = "draft.bail_app"
PREMIUM_DRAFT_2 = "draft.suretyship_app"


class EntitlementService:
    @staticmethod
    def has_access(conn, user_id: int, feature_key: str) -> bool:
        """Determines if an advocate has access to a specific feature_key.

        This is the single centralized access decision point.
        """
        if not user_id or not feature_key:
            return False

        # 1. Base free plan features are accessible to all registered advocates
        if feature_key in FREE_PLAN_DEFAULT_FEATURES:
            return True

        cur = conn.cursor()
        try:
            # 2. Check direct active unexpired entitlement record
            cur.execute(
                """
                SELECT id FROM entitlements
                WHERE user_id = %s 
                  AND feature_key = %s 
                  AND status = 'active'
                  AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                LIMIT 1
                """,
                (user_id, feature_key),
            )
            if cur.fetchone():
                return True

            # 3. Check active subscription plan features
            cur.execute(
                """
                SELECT pf.id 
                FROM subscriptions s
                JOIN plans p ON s.plan_id = p.id
                JOIN plan_features pf ON pf.plan_id = p.id
                WHERE s.user_id = %s
                  AND s.status = 'active'
                  AND (s.end_date IS NULL OR s.end_date > CURRENT_TIMESTAMP)
                  AND pf.feature_key = %s
                  AND p.is_active = true
                LIMIT 1
                """,
                (user_id, feature_key),
            )
            if cur.fetchone():
                return True

            return False
        finally:
            cur.close()

    @staticmethod
    def get_user_plan_summary(conn, user_id: int) -> dict:
        """Returns the full plan, subscription, and entitlements summary for a user."""
        if not user_id:
            return {
                "plan": {
                    "slug": "free",
                    "name": "Free",
                    "price": 0,
                    "currency": "INR",
                    "billing_interval": "month",
                },
                "subscription": None,
                "entitlements": list(FREE_PLAN_DEFAULT_FEATURES),
                "is_pro": False,
            }

        cur = conn.cursor()
        try:
            # Query active subscription joined with plan
            cur.execute(
                """
                SELECT 
                    s.id AS subscription_id,
                    s.status AS subscription_status,
                    s.start_date,
                    s.end_date,
                    p.id AS plan_id,
                    p.slug AS plan_slug,
                    p.name AS plan_name,
                    p.price AS plan_price,
                    p.currency AS plan_currency,
                    p.billing_interval AS plan_interval
                FROM subscriptions s
                JOIN plans p ON s.plan_id = p.id
                WHERE s.user_id = %s
                  AND s.status = 'active'
                  AND (s.end_date IS NULL OR s.end_date > CURRENT_TIMESTAMP)
                ORDER BY s.end_date DESC NULLS LAST, s.created_at DESC
                LIMIT 1
                """,
                (user_id,),
            )
            sub_row = cur.fetchone()

            # Query all active unexpired explicit entitlements
            cur.execute(
                """
                SELECT DISTINCT feature_key 
                FROM entitlements
                WHERE user_id = %s 
                  AND status = 'active'
                  AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                """,
                (user_id,),
            )
            entitlement_rows = cur.fetchall()
            entitlements_set = {r["feature_key"] for r in entitlement_rows}
            entitlements_set.update(FREE_PLAN_DEFAULT_FEATURES)

            if sub_row:
                # Add plan features associated with the active plan
                cur.execute(
                    """
                    SELECT feature_key FROM plan_features WHERE plan_id = %s
                    """,
                    (sub_row["plan_id"],),
                )
                plan_feature_rows = cur.fetchall()
                for pf in plan_feature_rows:
                    entitlements_set.add(pf["feature_key"])

                start_date_str = (
                    sub_row["start_date"].isoformat()
                    if hasattr(sub_row["start_date"], "isoformat")
                    else str(sub_row["start_date"])
                    if sub_row["start_date"]
                    else None
                )
                end_date_str = (
                    sub_row["end_date"].isoformat()
                    if hasattr(sub_row["end_date"], "isoformat")
                    else str(sub_row["end_date"])
                    if sub_row["end_date"]
                    else None
                )

                return {
                    "plan": {
                        "slug": sub_row["plan_slug"],
                        "name": sub_row["plan_name"],
                        "price": sub_row["plan_price"],
                        "currency": sub_row["plan_currency"],
                        "billing_interval": sub_row["plan_interval"],
                    },
                    "subscription": {
                        "status": sub_row["subscription_status"],
                        "start_date": start_date_str,
                        "end_date": end_date_str,
                    },
                    "entitlements": sorted(list(entitlements_set)),
                    "is_pro": sub_row["plan_slug"] == "pro",
                }

            # If no active subscription, load Free plan record
            cur.execute(
                "SELECT id, slug, name, price, currency, billing_interval FROM plans WHERE slug = 'free'"
            )
            free_plan = cur.fetchone() or {
                "slug": "free",
                "name": "Free",
                "price": 0,
                "currency": "INR",
                "billing_interval": "month",
            }

            return {
                "plan": {
                    "slug": free_plan["slug"],
                    "name": free_plan["name"],
                    "price": free_plan["price"],
                    "currency": free_plan["currency"],
                    "billing_interval": free_plan["billing_interval"],
                },
                "subscription": None,
                "entitlements": sorted(list(entitlements_set)),
                "is_pro": False,
            }
        finally:
            cur.close()

    @staticmethod
    def grant_plan_entitlements(
        conn,
        user_id: int,
        plan_id_or_slug,
        duration_days: int = 30,
        razorpay_customer_id: str = None,
        razorpay_subscription_id: str = None,
    ) -> dict:
        """Activates a plan subscription and inserts all associated entitlements for the given duration."""
        cur = conn.cursor()
        try:
            # Resolve plan record
            if isinstance(plan_id_or_slug, int):
                cur.execute("SELECT * FROM plans WHERE id = %s", (plan_id_or_slug,))
            else:
                cur.execute("SELECT * FROM plans WHERE slug = %s", (str(plan_id_or_slug),))
            plan = cur.fetchone()
            if not plan:
                raise ValueError(f"Plan '{plan_id_or_slug}' not found.")

            plan_id = plan["id"]

            # Calculate new subscription dates
            cur.execute(
                """
                SELECT end_date FROM subscriptions
                WHERE user_id = %s AND plan_id = %s AND status = 'active'
                  AND end_date > CURRENT_TIMESTAMP
                ORDER BY end_date DESC LIMIT 1
                """,
                (user_id, plan_id),
            )
            existing_sub = cur.fetchone()

            if existing_sub and existing_sub["end_date"]:
                # Extend from current active expiration
                cur.execute(
                    """
                    INSERT INTO subscriptions (
                        user_id, plan_id, status, start_date, end_date,
                        razorpay_customer_id, razorpay_subscription_id
                    )
                    VALUES (
                        %s, %s, 'active', CURRENT_TIMESTAMP,
                        %s + (%s || ' days')::interval,
                        %s, %s
                    )
                    RETURNING id, start_date, end_date
                    """,
                    (
                        user_id,
                        plan_id,
                        existing_sub["end_date"],
                        duration_days,
                        razorpay_customer_id,
                        razorpay_subscription_id,
                    ),
                )
            else:
                cur.execute(
                    """
                    INSERT INTO subscriptions (
                        user_id, plan_id, status, start_date, end_date,
                        razorpay_customer_id, razorpay_subscription_id
                    )
                    VALUES (
                        %s, %s, 'active', CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP + (%s || ' days')::interval,
                        %s, %s
                    )
                    RETURNING id, start_date, end_date
                    """,
                    (
                        user_id,
                        plan_id,
                        duration_days,
                        razorpay_customer_id,
                        razorpay_subscription_id,
                    ),
                )

            new_sub = cur.fetchone()
            sub_id = new_sub["id"]
            expires_at = new_sub["end_date"]

            # Fetch all features mapped to this plan
            cur.execute("SELECT feature_key FROM plan_features WHERE plan_id = %s", (plan_id,))
            features = cur.fetchall()

            # Upsert into entitlements table
            for f in features:
                f_key = f["feature_key"]
                cur.execute(
                    """
                    INSERT INTO entitlements (
                        user_id, feature_key, source, status, starts_at, expires_at, updated_at
                    )
                    VALUES (%s, %s, 'subscription', 'active', CURRENT_TIMESTAMP, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id, feature_key, source) DO UPDATE
                    SET status = 'active',
                        expires_at = EXCLUDED.expires_at,
                        updated_at = CURRENT_TIMESTAMP
                    """,
                    (user_id, f_key, expires_at),
                )

            return {
                "subscription_id": sub_id,
                "plan_id": plan_id,
                "plan_slug": plan["slug"],
                "expires_at": expires_at,
            }
        finally:
            cur.close()

    @staticmethod
    def revoke_plan_entitlements(conn, user_id: int, plan_id_or_slug=None) -> None:
        """Revokes active subscriptions and associated subscription entitlements for an advocate."""
        cur = conn.cursor()
        try:
            if plan_id_or_slug:
                if isinstance(plan_id_or_slug, int):
                    cur.execute("SELECT id FROM plans WHERE id = %s", (plan_id_or_slug,))
                else:
                    cur.execute("SELECT id FROM plans WHERE slug = %s", (str(plan_id_or_slug),))
                p = cur.fetchone()
                p_id = p["id"] if p else None
                if p_id:
                    cur.execute(
                        """
                        UPDATE subscriptions
                        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = %s AND plan_id = %s AND status = 'active'
                        """,
                        (user_id, p_id),
                    )
            else:
                cur.execute(
                    """
                    UPDATE subscriptions
                    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s AND status = 'active'
                    """,
                    (user_id,),
                )

            # Mark subscription entitlements as revoked
            cur.execute(
                """
                UPDATE entitlements
                SET status = 'revoked', updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s AND source = 'subscription' AND status = 'active'
                """,
                (user_id,),
            )
        finally:
            cur.close()
