"""
Advo Buddy - Case & Hearing Tracker for Advocates (Multi-User Version)
Many advocates can sign up and use this app - each advocate only sees
their own cases. Built to save advocates time on manual diary management.

This is a pure JSON API. The frontend is a decoupled React (Vite) SPA
that lives in frontend/ and talks to these endpoints over fetch(). Auth
is handled by Supabase Auth: the frontend signs up/logs in directly via
the Supabase JS client and sends the resulting Supabase access token back
as `Authorization: Bearer <token>` on every request; this app verifies
that token with Supabase and maps it to a local `advocates` row (see
`login_required`/`resolve_advocate` below) for all business data.
"""

from flask import Flask, request, jsonify, Response, g, has_app_context, send_from_directory
from datetime import datetime, timedelta
from functools import wraps
import csv
import io
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import psycopg2
import psycopg2.extras
from psycopg2 import pool as pg_pool
from flask_cors import CORS
from supabase import create_client
from advobuddy.ecourts import (
    start_ecourts_search,
    refresh_ecourts_captcha,
    submit_ecourts_captcha,
    get_ecourts_metadata,
)
from advobuddy.blueprints.courts import courts_bp

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "advo-buddy-secret-key-change-this-in-production")

CORS(app, resources={r"/api/*": {"origins": "*"}})
app.register_blueprint(courts_bp)

DATABASE_URL = os.environ.get("DATABASE_URL")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

STALE_CASE_DAYS = 60

UPLOAD_FOLDER = os.path.join(app.root_path, "static", "uploads", "avatars")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Built React frontend (frontend/dist, produced by `npm run build`) - served
# directly by this same Flask app in production so one deployment covers
# both the API and the UI. In local dev this directory won't exist (the
# frontend runs under its own Vite dev server instead), so routes below fall
# back to the plain JSON health check.
FRONTEND_DIST = os.path.join(app.root_path, "frontend", "dist")


_supabase_client = None


def get_supabase():
    # Built once and reused - constructing a fresh Supabase client (and its
    # underlying HTTP client) on every request added several seconds of
    # overhead to every authenticated call.
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_ANON_KEY are not set - required to verify "
                "Supabase Auth tokens. Set them in your .env / host environment."
            )
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _supabase_client


_connection_pool = None


class _PooledConnection:
    """Wraps a pooled psycopg2 connection so the existing conn.close() calls
    throughout this file return it to the pool instead of tearing down the
    TCP/TLS connection. Opening a fresh connection to Supabase costs ~1s
    (network round trips for the TLS + Postgres SCRAM auth handshake), and
    every route was paying that cost on every single request - reusing
    connections is what actually fixes slow page loads."""

    def __init__(self, pool, conn, shared=False):
        self._pool = pool
        self._conn = conn
        self._returned = False
        self._shared = shared

    def cursor(self, *args, **kwargs):
        return self._conn.cursor(*args, **kwargs)

    def commit(self):
        self._conn.commit()

    def close(self):
        # Route/helper functions throughout this file call close() when THEY
        # are done with it - fine when each call got its own connection, but
        # a shared (request-scoped, see get_db()) connection is still needed
        # by other code later in the same request. Returning it to the pool
        # here would let a concurrent request check out the same live
        # connection object. Only teardown_appcontext (via _release()) may
        # actually return a shared connection to the pool.
        if self._shared:
            return
        self._release()

    def _release(self):
        if self._returned:
            return
        self._returned = True
        conn = self._conn
        try:
            if not conn.closed:
                conn.rollback()
            self._pool.putconn(conn, close=conn.closed)
        except Exception:
            try:
                self._pool.putconn(conn, close=True)
            except Exception:
                pass


def _get_pool():
    global _connection_pool
    if _connection_pool is None:
        if not DATABASE_URL:
            raise RuntimeError(
                "DATABASE_URL is not set. Advo Buddy now requires a Postgres "
                "(Supabase) database - set DATABASE_URL in your .env / host "
                "environment variables."
            )
        # Standardize postgres:// to postgresql:// for psycopg2 compatibility
        db_url = DATABASE_URL
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        _connection_pool = pg_pool.ThreadedConnectionPool(
            1, 10, db_url, cursor_factory=psycopg2.extras.RealDictCursor
        )
    return _connection_pool


def _checkout_live_connection(pool):
    # A pooled connection can go stale while sitting idle in the free list -
    # Supabase's pooler can silently drop it server-side, which the client
    # only discovers on the next query ("connection already closed"). Test
    # each checkout with a trivial query and discard/retry on a dead one
    # instead of surfacing that as a 500 to the caller.
    last_error = None
    for _ in range(3):
        conn = pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
            return conn
        except Exception as e:
            last_error = e
            try:
                pool.putconn(conn, close=True)
            except Exception:
                pass
    raise last_error


def get_db():
    # Within a single request, share one connection across every get_db()
    # call (login_required's advocate lookup, plus whatever the route body
    # does) instead of checking out a separate one for each - each round
    # trip to Supabase costs real time, so cutting redundant ones matters.
    # Falls back to an uncached connection outside a request/app context
    # (e.g. init_db() at startup, or send_reminders.py run as a standalone
    # script), since Flask's `g` only exists inside one.
    pool = _get_pool()
    if has_app_context():
        if not hasattr(g, "_db_conn"):
            g._db_conn = _PooledConnection(pool, _checkout_live_connection(pool), shared=True)
        return g._db_conn
    return _PooledConnection(pool, _checkout_live_connection(pool))


@app.teardown_appcontext
def _release_db_connection(exception=None):
    conn = g.pop("_db_conn", None)
    if conn is not None:
        conn._release()


def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS advocates (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            bar_council_number TEXT,
            password_hash TEXT NOT NULL,
            reminder_method TEXT DEFAULT 'none',
            reminder_days_before INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id SERIAL PRIMARY KEY,
            advocate_id INTEGER NOT NULL,
            client_name TEXT NOT NULL,
            client_phone TEXT,
            case_number TEXT NOT NULL,
            court_name TEXT NOT NULL,
            case_type TEXT,
            next_hearing_date TEXT NOT NULL,
            notes TEXT,
            status TEXT DEFAULT 'Active',
            notify_client INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (advocate_id) REFERENCES advocates (id)
        )
    """)
    # Keeps every hearing-date update for a case, so an advocate can see
    # the full 1, 2, 3... history of postponements/next-dates for a case,
    # not just the latest one. The most recent entry is the "Active" one.
    cur.execute("""
        CREATE TABLE IF NOT EXISTS hearing_history (
            id SERIAL PRIMARY KEY,
            case_id INTEGER NOT NULL,
            hearing_date TEXT NOT NULL,
            note TEXT,
            added_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (case_id) REFERENCES cases (id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS case_tasks (
            id SERIAL PRIMARY KEY,
            case_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            is_completed INTEGER DEFAULT 0,
            FOREIGN KEY (case_id) REFERENCES cases (id)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS case_audit_log (
            id SERIAL PRIMARY KEY,
            case_id INTEGER NOT NULL,
            advocate_id INTEGER NOT NULL,
            field_changed TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (case_id) REFERENCES cases (id),
            FOREIGN KEY (advocate_id) REFERENCES advocates (id)
        )
    """)

    def col_exists(col):
        cur.execute("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='cases' AND column_name=%s
        """, (col,))
        return cur.fetchone() is not None

    cols_to_add = [
        ("opposing_counsel", "TEXT"),
        ("opposing_counsel_phone", "TEXT"),
        ("judge_name", "TEXT"),
        ("court_hall", "TEXT"),
        ("item_number", "TEXT"),
        ("case_stage", "TEXT"),
        ("total_fee", "INTEGER DEFAULT 0"),
        ("fee_paid", "INTEGER DEFAULT 0"),
        ("expenses", "INTEGER DEFAULT 0"),
        ("client_email", "TEXT")
    ]
    for col, col_type in cols_to_add:
        if not col_exists(col):
            cur.execute(f"ALTER TABLE cases ADD COLUMN {col} {col_type}")

    advocate_cols_to_add = [
        ("profile_image", "TEXT"),
        ("office_address", "TEXT"),
        ("specialization", "TEXT"),
        ("auth_user_id", "UUID UNIQUE"),
        ("role", "TEXT DEFAULT 'advocate'"),
        ("college_name", "TEXT"),
        ("course_year", "TEXT"),
        ("student_id_number", "TEXT"),
        ("areas_of_interest", "TEXT"),
    ]
    for col, col_type in advocate_cols_to_add:
        cur.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name='advocates' AND column_name=%s
        """, (col,))
        has_col = cur.fetchone() is not None

        if not has_col:
            cur.execute(f"ALTER TABLE advocates ADD COLUMN {col} {col_type}")

    # Student-Specific Tables
    cur.execute("""
        CREATE TABLE IF NOT EXISTS moot_courts (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            organizer TEXT,
            side TEXT,
            team_members TEXT,
            memorial_deadline TEXT,
            competition_date TEXT,
            proposition_summary TEXT,
            memorial_notes TEXT,
            bench_questions TEXT,
            status TEXT DEFAULT 'Active',
            result TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES advocates (id)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS internship_diaries (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL,
            organization TEXT NOT NULL,
            mentor_name TEXT,
            internship_type TEXT,
            start_date TEXT,
            end_date TEXT,
            stipend TEXT,
            summary TEXT,
            status TEXT DEFAULT 'Active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES advocates (id)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS internship_logs (
            id SERIAL PRIMARY KEY,
            diary_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            log_date TEXT NOT NULL,
            court_hall TEXT,
            case_observed TEXT,
            advocate_arguing TEXT,
            proceedings_summary TEXT,
            key_learnings TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (diary_id) REFERENCES internship_diaries (id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES advocates (id)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS case_briefs (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL,
            case_title TEXT NOT NULL,
            citation TEXT,
            court TEXT,
            subject TEXT,
            facts TEXT,
            issues TEXT,
            rule_of_law TEXT,
            analysis_arguments TEXT,
            conclusion_judgment TEXT,
            ratio_decidendi TEXT,
            obiter_dicta TEXT,
            tags TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES advocates (id)
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS student_study_tasks (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            topic TEXT NOT NULL,
            due_date TEXT,
            priority TEXT DEFAULT 'Medium',
            task_type TEXT DEFAULT 'Assignment',
            is_completed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES advocates (id)
        )
    """)

    # Supabase Auth now owns credentials; local password_hash is unused for
    # new rows (kept, not dropped, to avoid a destructive column removal).
    cur.execute("ALTER TABLE advocates ALTER COLUMN password_hash DROP NOT NULL")

    conn.commit()
    cur.close()
    conn.close()


def add_history_entry(conn, case_id, hearing_date, note=None):
    """Appends a new hearing-date entry to a case's history (does not
    overwrite previous entries)."""
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO hearing_history (case_id, hearing_date, note) VALUES (%s, %s, %s)",
        (case_id, hearing_date, note),
    )
    cur.close()


def check_hearing_conflict(conn, advocate_id, court_name, hearing_date, exclude_case_id=None):
    """Queries active cases for the advocate matching the same court_name and next_hearing_date."""
    if not court_name or not hearing_date:
        return []
    cur = conn.cursor()
    if exclude_case_id:
        cur.execute(
            """SELECT case_number FROM cases
               WHERE advocate_id=%s AND LOWER(court_name)=LOWER(%s) AND next_hearing_date=%s AND status='Active' AND id!=%s""",
            (advocate_id, court_name.strip(), hearing_date.strip(), exclude_case_id),
        )
    else:
        cur.execute(
            """SELECT case_number FROM cases
               WHERE advocate_id=%s AND LOWER(court_name)=LOWER(%s) AND next_hearing_date=%s AND status='Active'""",
            (advocate_id, court_name.strip(), hearing_date.strip()),
        )
    rows = cur.fetchall()
    cur.close()
    return [row["case_number"] for row in rows]


def advocate_public(row):
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row.get("role") or "advocate",
        "college_name": row.get("college_name") or "",
        "course_year": row.get("course_year") or "",
        "student_id_number": row.get("student_id_number") or "",
        "areas_of_interest": row.get("areas_of_interest") or "",
        "phone": row.get("phone"),
        "bar_council_number": row.get("bar_council_number"),
        "office_address": row.get("office_address"),
        "specialization": row.get("specialization"),
        "reminder_method": row.get("reminder_method") or "none",
        "reminder_days_before": row.get("reminder_days_before") or 1,
        "profile_image": row.get("profile_image"),
        "avatar_url": f"/static/uploads/avatars/{row['profile_image']}" if row.get("profile_image") else None,
        "created_at": row.get("created_at"),
    }


# ---------- Auth ----------

def resolve_advocate_id(supa_user):
    """Maps a verified Supabase Auth user to the local advocates.id,
    auto-provisioning a row the first time a given Supabase user is seen
    (profile fields come from the signup metadata set via the frontend's
    supabase.auth.signUp({ options: { data: {...} } }) call)."""
    metadata = supa_user.user_metadata or {}
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, email, role FROM advocates WHERE auth_user_id=%s", (supa_user.id,))
    row = cur.fetchone()

    if row is None:
        # No row linked to this Supabase identity yet - check if email already exists
        cur.execute("SELECT id FROM advocates WHERE email=%s", (supa_user.email,))
        existing = cur.fetchone()
        if existing:
            advocate_id = existing["id"]
            cur.execute(
                """UPDATE advocates SET auth_user_id=%s,
                   role=COALESCE(NULLIF(%s, ''), role),
                   college_name=COALESCE(NULLIF(%s, ''), college_name),
                   course_year=COALESCE(NULLIF(%s, ''), course_year),
                   student_id_number=COALESCE(NULLIF(%s, ''), student_id_number),
                   areas_of_interest=COALESCE(NULLIF(%s, ''), areas_of_interest)
                   WHERE id=%s""",
                (supa_user.id, metadata.get("role"), metadata.get("college_name"),
                 metadata.get("course_year"), metadata.get("student_id_number"),
                 metadata.get("areas_of_interest"), advocate_id),
            )
        else:
            cur.execute(
                """INSERT INTO advocates (name, email, phone, bar_council_number, auth_user_id,
                   role, college_name, course_year, student_id_number, areas_of_interest)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (
                    metadata.get("name") or supa_user.email,
                    supa_user.email,
                    metadata.get("phone") or "",
                    metadata.get("bar_council_number") or "",
                    supa_user.id,
                    metadata.get("role") or "advocate",
                    metadata.get("college_name") or "",
                    metadata.get("course_year") or "",
                    metadata.get("student_id_number") or "",
                    metadata.get("areas_of_interest") or "",
                ),
            )
            advocate_id = cur.fetchone()["id"]
    else:
        advocate_id = row["id"]
        # Sync role and student profile metadata if updated
        if metadata.get("role"):
            cur.execute(
                """UPDATE advocates SET 
                   role=COALESCE(NULLIF(%s, ''), role),
                   college_name=COALESCE(NULLIF(%s, ''), college_name),
                   course_year=COALESCE(NULLIF(%s, ''), course_year),
                   student_id_number=COALESCE(NULLIF(%s, ''), student_id_number),
                   areas_of_interest=COALESCE(NULLIF(%s, ''), areas_of_interest)
                   WHERE id=%s""",
                (metadata.get("role"), metadata.get("college_name"),
                 metadata.get("course_year"), metadata.get("student_id_number"),
                 metadata.get("areas_of_interest"), advocate_id),
            )
        if row["email"] != supa_user.email:
            cur.execute("UPDATE advocates SET email=%s WHERE id=%s", (supa_user.email, advocate_id))

    conn.commit()
    cur.close()
    conn.close()
    return advocate_id


def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if getattr(g, "advocate_id", None):
            return f(*args, **kwargs)

        auth_header = request.headers.get("Authorization", "")
        token = auth_header[7:] if auth_header.startswith("Bearer ") else None
        if not token:
            return jsonify({"error": "Please log in to continue."}), 401

        try:
            supa_user = get_supabase().auth.get_user(token).user
        except Exception:
            supa_user = None

        if supa_user is None:
            return jsonify({"error": "Please log in to continue."}), 401

        g.advocate_id = resolve_advocate_id(supa_user)
        return f(*args, **kwargs)
    return wrapper


@app.route("/")
def index():
    if os.path.isfile(os.path.join(FRONTEND_DIST, "index.html")):
        return send_from_directory(FRONTEND_DIST, "index.html")
    return jsonify({"service": "Advo Buddy API", "status": "ok"})


@app.route("/<path:path>")
def serve_frontend(path):
    # Only reached for paths that don't match any other route above (Flask/
    # Werkzeug prefers the more specific /api/* and /static/* rules first),
    # so this is either a real built asset (JS/CSS/images) or a client-side
    # route like /dashboard that only React Router knows about - fall back
    # to index.html for the latter so a hard refresh on any page still works.
    if not os.path.isdir(FRONTEND_DIST):
        return jsonify({"error": "Not found"}), 404
    requested = os.path.join(FRONTEND_DIST, path)
    if os.path.isfile(requested):
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")


@app.route("/api/auth/me")
@login_required
def me():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM advocates WHERE id=%s", (g.advocate_id,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()
    if not advocate:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"advocate": advocate_public(advocate)})


# ---------- Settings ----------

@app.route("/api/settings", methods=["GET"])
@login_required
def get_settings():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM advocates WHERE id=%s", (g.advocate_id,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"advocate": advocate_public(advocate)})


@app.route("/api/settings", methods=["PUT"])
@login_required
def update_settings():
    # Email is owned by Supabase Auth now (changed client-side via
    # supabase.auth.updateUser({ email })), so it's not writable here -
    # login_required keeps advocates.email synced to Supabase's copy.
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    bar_number = (data.get("bar_council_number") or "").strip()
    office_address = (data.get("office_address") or "").strip()
    specialization = (data.get("specialization") or "").strip()
    reminder_method = data.get("reminder_method", "none")
    reminder_days_before = data.get("reminder_days_before", 1)

    role = (data.get("role") or "").strip().lower()
    college_name = (data.get("college_name") or "").strip()
    course_year = (data.get("course_year") or "").strip()
    student_id_number = (data.get("student_id_number") or "").strip()
    areas_of_interest = (data.get("areas_of_interest") or "").strip()

    if not name:
        return jsonify({"error": "Name is required."}), 400

    conn = get_db()
    cur = conn.cursor()

    if role in ["advocate", "student"]:
        cur.execute(
            """UPDATE advocates SET name=%s, phone=%s, bar_council_number=%s,
               office_address=%s, specialization=%s, reminder_method=%s, reminder_days_before=%s,
               role=%s, college_name=%s, course_year=%s, student_id_number=%s, areas_of_interest=%s
               WHERE id=%s""",
            (name, phone, bar_number, office_address, specialization,
             reminder_method, reminder_days_before, role, college_name, course_year,
             student_id_number, areas_of_interest, g.advocate_id),
        )
    else:
        cur.execute(
            """UPDATE advocates SET name=%s, phone=%s, bar_council_number=%s,
               office_address=%s, specialization=%s, reminder_method=%s, reminder_days_before=%s,
               college_name=%s, course_year=%s, student_id_number=%s, areas_of_interest=%s
               WHERE id=%s""",
            (name, phone, bar_number, office_address, specialization,
             reminder_method, reminder_days_before, college_name, course_year,
             student_id_number, areas_of_interest, g.advocate_id),
        )
    conn.commit()

    cur.execute("SELECT * FROM advocates WHERE id=%s", (g.advocate_id,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"advocate": advocate_public(advocate), "message": "Profile and settings updated successfully!"})


@app.route("/api/role/switch", methods=["POST"])
@login_required
def switch_role():
    data = request.get_json(silent=True) or {}
    new_role = (data.get("role") or "").strip().lower()

    conn = get_db()
    cur = conn.cursor()

    if new_role not in ["advocate", "student"]:
        cur.execute("SELECT role FROM advocates WHERE id=%s", (g.advocate_id,))
        row = cur.fetchone()
        cur_role = row.get("role") if row and row.get("role") else "advocate"
        new_role = "student" if cur_role == "advocate" else "advocate"

    cur.execute("UPDATE advocates SET role=%s WHERE id=%s", (new_role, g.advocate_id))
    conn.commit()

    cur.execute("SELECT * FROM advocates WHERE id=%s", (g.advocate_id,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({
        "advocate": advocate_public(advocate),
        "role": new_role,
        "message": f"Successfully switched to {'Law Student' if new_role == 'student' else 'Advocate'} portal!",
    })


@app.route("/api/settings/avatar", methods=["POST"])
@login_required
def upload_avatar():
    if "profile_image" not in request.files:
        return jsonify({"error": "No file provided."}), 400
    file = request.files["profile_image"]
    if not file or file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Invalid image format. Allowed: PNG, JPG, JPEG, WEBP, GIF."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT profile_image FROM advocates WHERE id=%s", (g.advocate_id,))
    adv_rec = cur.fetchone()
    current_image = adv_rec.get("profile_image") if adv_rec else None

    filename = f"avatar_{g.advocate_id}_{int(datetime.now().timestamp())}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    if current_image and current_image != filename:
        old_path = os.path.join(UPLOAD_FOLDER, current_image)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    cur.execute("UPDATE advocates SET profile_image=%s WHERE id=%s", (filename, g.advocate_id))
    conn.commit()

    cur.execute("SELECT * FROM advocates WHERE id=%s", (g.advocate_id,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"advocate": advocate_public(advocate)})


@app.route("/api/settings/avatar", methods=["DELETE"])
@login_required
def delete_avatar():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT profile_image FROM advocates WHERE id=%s", (g.advocate_id,))
    advocate = cur.fetchone()
    if advocate and advocate.get("profile_image"):
        old_image = advocate["profile_image"]
        old_path = os.path.join(UPLOAD_FOLDER, old_image)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass
        cur.execute("UPDATE advocates SET profile_image=NULL WHERE id=%s", (g.advocate_id,))
        conn.commit()

    cur.execute("SELECT * FROM advocates WHERE id=%s", (g.advocate_id,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"advocate": advocate_public(advocate), "message": "Profile picture removed."})


# ---------- Dashboard ----------

@app.route("/api/dashboard")
@login_required
def dashboard():
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    today = datetime.now().date()

    cur.execute(
        """SELECT c.*, COALESCE(
               (SELECT MAX(added_at) FROM hearing_history WHERE case_id = c.id),
               c.created_at
           ) AS last_updated_at
           FROM cases c
           WHERE c.status='Active' AND c.advocate_id=%s
           ORDER BY c.next_hearing_date ASC""",
        (advocate_id,),
    )
    all_cases = cur.fetchall()
    cur.close()
    conn.close()

    overdue, today_list, this_week, upcoming = [], [], [], []
    stale_cases_count = 0

    for case in all_cases:
        hearing_date = datetime.strptime(case["next_hearing_date"], "%Y-%m-%d").date()
        days_left = (hearing_date - today).days

        last_updated_raw = str(case.get("last_updated_at") or case.get("created_at") or today.strftime("%Y-%m-%d"))[:10]
        try:
            last_update_date = datetime.strptime(last_updated_raw, "%Y-%m-%d").date()
        except ValueError:
            last_update_date = today

        days_since_update = (today - last_update_date).days
        is_stale = (days_since_update >= STALE_CASE_DAYS)
        case["days_since_update"] = days_since_update
        case["is_stale"] = is_stale
        case["days_left"] = days_left
        if is_stale:
            stale_cases_count += 1

        if days_left < 0:
            overdue.append(case)
        elif days_left == 0:
            today_list.append(case)
        elif days_left <= 7:
            this_week.append(case)
        else:
            upcoming.append(case)

    return jsonify({
        "overdue": overdue,
        "today": today_list,
        "this_week": this_week,
        "upcoming": upcoming,
        "total_cases": len(all_cases),
        "stale_cases_count": stale_cases_count,
        "stale_case_days": STALE_CASE_DAYS,
    })


@app.route("/api/clients")
@login_required
def client_directory():
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM cases WHERE advocate_id=%s AND status != 'Deleted' ORDER BY client_name ASC",
        (advocate_id,),
    )
    all_cases = cur.fetchall()
    cur.close()
    conn.close()

    clients = {}
    for case in all_cases:
        key = (case["client_name"], case["client_phone"] or "")
        if key not in clients:
            clients[key] = {
                "name": case["client_name"],
                "phone": case["client_phone"],
                "cases": [],
                "case_count": 0,
            }
        clients[key]["cases"].append(case)
        clients[key]["case_count"] += 1

    client_list = sorted(clients.values(), key=lambda c: c["name"].lower())
    return jsonify({"clients": client_list})


# ---------- Cases ----------

CASE_FIELDS = [
    "client_name", "client_phone", "client_email", "case_number", "court_name", "case_type",
    "next_hearing_date", "notes", "notify_client", "opposing_counsel",
    "opposing_counsel_phone", "judge_name", "court_hall", "item_number",
    "case_stage", "total_fee", "fee_paid", "expenses",
]


def _parse_case_payload(data):
    client_name = (data.get("client_name") or "").strip()
    client_phone = (data.get("client_phone") or "").strip()
    client_email = (data.get("client_email") or "").strip()
    case_number = (data.get("case_number") or "").strip()
    court_name = (data.get("court_name") or "").strip()
    case_type = (data.get("case_type") or "").strip()
    next_hearing_date = data.get("next_hearing_date") or ""
    notes = (data.get("notes") or "").strip()
    notify_client = 1 if data.get("notify_client") else 0
    opposing_counsel = (data.get("opposing_counsel") or "").strip()
    opposing_counsel_phone = (data.get("opposing_counsel_phone") or "").strip()
    judge_name = (data.get("judge_name") or "").strip()
    court_hall = (data.get("court_hall") or "").strip()
    item_number = (data.get("item_number") or "").strip()
    case_stage = (data.get("case_stage") or "").strip()

    def as_int(value):
        try:
            return int(value or 0)
        except (ValueError, TypeError):
            return 0

    return {
        "client_name": client_name,
        "client_phone": client_phone,
        "client_email": client_email,
        "case_number": case_number,
        "court_name": court_name,
        "case_type": case_type,
        "next_hearing_date": next_hearing_date,
        "notes": notes,
        "notify_client": notify_client,
        "opposing_counsel": opposing_counsel,
        "opposing_counsel_phone": opposing_counsel_phone,
        "judge_name": judge_name,
        "court_hall": court_hall,
        "item_number": item_number,
        "case_stage": case_stage,
        "total_fee": as_int(data.get("total_fee")),
        "fee_paid": as_int(data.get("fee_paid")),
        "expenses": as_int(data.get("expenses")),
    }


@app.route("/api/cases", methods=["POST"])
@login_required
def add_case():
    advocate_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    f = _parse_case_payload(data)

    if not f["client_name"] or not f["case_number"] or not f["court_name"] or not f["next_hearing_date"]:
        return jsonify({"error": "Please fill all required fields."}), 400

    conn = get_db()
    cur = conn.cursor()

    conflicts = check_hearing_conflict(conn, advocate_id, f["court_name"], f["next_hearing_date"])

    cur.execute(
        """INSERT INTO cases
           (advocate_id, client_name, client_phone, client_email, case_number, court_name, case_type, next_hearing_date, notes, notify_client,
            opposing_counsel, opposing_counsel_phone, judge_name, court_hall, item_number, case_stage, total_fee, fee_paid, expenses)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (advocate_id, f["client_name"], f["client_phone"], f["client_email"], f["case_number"], f["court_name"], f["case_type"],
         f["next_hearing_date"], f["notes"], f["notify_client"], f["opposing_counsel"], f["opposing_counsel_phone"],
         f["judge_name"], f["court_hall"], f["item_number"], f["case_stage"], f["total_fee"], f["fee_paid"], f["expenses"]),
    )
    new_case_id = cur.fetchone()["id"]
    add_history_entry(conn, new_case_id, f["next_hearing_date"], note="Case created")
    conn.commit()

    cur.execute("SELECT * FROM cases WHERE id=%s", (new_case_id,))
    case = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({
        "case": case,
        "conflicts": conflicts,
        "message": f"Case '{f['case_number']}' added successfully!",
    }), 201


@app.route("/api/cases/<int:case_id>", methods=["GET"])
@login_required
def get_case(case_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM cases WHERE id=%s AND advocate_id=%s", (case_id, g.advocate_id))
    case = cur.fetchone()
    cur.close()
    conn.close()
    if case is None:
        return jsonify({"error": "Case not found."}), 404
    return jsonify({"case": case})


@app.route("/api/cases/<int:case_id>", methods=["PUT"])
@login_required
def edit_case(case_id):
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        return jsonify({"error": "Case not found."}), 404

    data = request.get_json(silent=True) or {}
    f = _parse_case_payload(data)
    status = data.get("status", "Active")

    date_changed = f["next_hearing_date"] != case["next_hearing_date"]

    fields_to_check = dict(f)
    fields_to_check["status"] = status
    for field_name, new_val in fields_to_check.items():
        old_val = case.get(field_name)
        if isinstance(new_val, int):
            old_cmp = int(old_val or 0)
            new_cmp = int(new_val)
        else:
            old_cmp = str(old_val or "").strip()
            new_cmp = str(new_val or "").strip()

        if old_cmp != new_cmp:
            cur.execute(
                """INSERT INTO case_audit_log (case_id, advocate_id, field_changed, old_value, new_value)
                   VALUES (%s, %s, %s, %s, %s)""",
                (case_id, advocate_id, field_name, str(old_val if old_val is not None else ""), str(new_val)),
            )

    conflicts = check_hearing_conflict(conn, advocate_id, f["court_name"], f["next_hearing_date"], exclude_case_id=case_id)

    cur.execute(
        """UPDATE cases SET client_name=%s, client_phone=%s, client_email=%s, case_number=%s, court_name=%s,
           case_type=%s, next_hearing_date=%s, notes=%s, status=%s, notify_client=%s,
           opposing_counsel=%s, opposing_counsel_phone=%s, judge_name=%s, court_hall=%s,
           item_number=%s, case_stage=%s, total_fee=%s, fee_paid=%s, expenses=%s
           WHERE id=%s AND advocate_id=%s""",
        (f["client_name"], f["client_phone"], f["client_email"], f["case_number"], f["court_name"], f["case_type"],
         f["next_hearing_date"], f["notes"], status, f["notify_client"], f["opposing_counsel"],
         f["opposing_counsel_phone"], f["judge_name"], f["court_hall"], f["item_number"], f["case_stage"],
         f["total_fee"], f["fee_paid"], f["expenses"], case_id, advocate_id),
    )

    if date_changed:
        add_history_entry(conn, case_id, f["next_hearing_date"])

    conn.commit()

    cur.execute("SELECT * FROM cases WHERE id=%s", (case_id,))
    updated_case = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({
        "case": updated_case,
        "conflicts": conflicts,
        "message": "Case updated successfully!",
    })


def build_archive_sections(archived_cases):
    closed_cases = [c for c in archived_cases if str(c.get("status") or "").strip().lower() == "closed"]
    deleted_cases = [c for c in archived_cases if str(c.get("status") or "").strip().lower() == "deleted"]
    onhold_cases = [c for c in archived_cases if str(c.get("status") or "").strip().lower() not in {"closed", "deleted"}]

    return {
        "closed_cases": closed_cases,
        "deleted_cases": deleted_cases,
        "onhold_cases": onhold_cases,
        "total_archived": len(archived_cases),
    }


@app.route("/api/cases/<int:case_id>", methods=["DELETE"])
@login_required
def delete_case(case_id):
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id, status FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        return jsonify({"error": "Case not found."}), 404

    old_status = case.get("status") or "Active"
    if old_status == "Deleted":
        # Hard delete
        cur.execute("DELETE FROM hearing_history WHERE case_id=%s", (case_id,))
        cur.execute("DELETE FROM case_audit_log WHERE case_id=%s", (case_id,))
        cur.execute("DELETE FROM case_tasks WHERE case_id=%s", (case_id,))
        cur.execute("DELETE FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True, "message": "Case permanently deleted."})
    else:
        # Soft delete
        cur.execute(
            """INSERT INTO case_audit_log (case_id, advocate_id, field_changed, old_value, new_value)
               VALUES (%s, %s, %s, %s, %s)""",
            (case_id, advocate_id, "status", old_status, "Deleted"),
        )
        cur.execute("UPDATE cases SET status='Deleted' WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True, "message": "Case moved to archive (Deleted)."})


@app.route("/api/cases/<int:case_id>/history")
@login_required
def case_history(case_id):
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        return jsonify({"error": "Case not found."}), 404

    cur.execute(
        "SELECT * FROM hearing_history WHERE case_id=%s ORDER BY added_at ASC, id ASC",
        (case_id,),
    )
    history = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify({"case": case, "history": history})


@app.route("/api/cases/<int:case_id>/audit")
@login_required
def case_audit(case_id):
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        return jsonify({"error": "Case not found."}), 404

    cur.execute(
        "SELECT * FROM case_audit_log WHERE case_id=%s AND advocate_id=%s ORDER BY changed_at DESC, id DESC",
        (case_id, advocate_id),
    )
    audit_logs = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify({"case": case, "audit_logs": audit_logs})


@app.route("/api/archive")
@login_required
def case_archive():
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """SELECT * FROM cases WHERE advocate_id=%s AND status!='Active'
           ORDER BY status ASC, client_name ASC""",
        (advocate_id,),
    )
    archived_cases = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify(build_archive_sections(archived_cases))


@app.route("/api/cases/<int:case_id>/reopen", methods=["POST"])
@login_required
def reopen_case(case_id):
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        return jsonify({"error": "Case not found."}), 404

    if case["status"] == "Active":
        cur.close()
        conn.close()
        return jsonify({"error": "Case is already active."}), 400

    old_status = case["status"]
    cur.execute(
        """INSERT INTO case_audit_log (case_id, advocate_id, field_changed, old_value, new_value)
           VALUES (%s, %s, %s, %s, %s)""",
        (case_id, advocate_id, "status", old_status, "Active"),
    )
    cur.execute(
        "UPDATE cases SET status='Active' WHERE id=%s AND advocate_id=%s",
        (case_id, advocate_id),
    )
    conn.commit()

    cur.execute("SELECT * FROM cases WHERE id=%s", (case_id,))
    updated_case = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"case": updated_case, "message": f"Case '{updated_case['case_number']}' reopened and moved back to Active."})


@app.route("/api/tasks")
@login_required
def tasks_hub():
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """SELECT t.id AS task_id, t.title, t.is_completed, t.case_id,
                  c.client_name, c.case_number, c.court_name, c.next_hearing_date
           FROM case_tasks t
           JOIN cases c ON t.case_id = c.id
           WHERE c.advocate_id=%s AND c.status='Active'
           ORDER BY c.next_hearing_date ASC, t.id ASC""",
        (advocate_id,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    cases_map = {}
    for row in rows:
        cid = row["case_id"]
        if cid not in cases_map:
            cases_map[cid] = {
                "case_id": cid,
                "client_name": row["client_name"],
                "case_number": row["case_number"],
                "court_name": row["court_name"],
                "next_hearing_date": row["next_hearing_date"],
                "tasks": [],
                "open_count": 0,
            }
        cases_map[cid]["tasks"].append(row)
        if not row["is_completed"]:
            cases_map[cid]["open_count"] += 1

    case_groups = [c for c in cases_map.values() if c["open_count"] > 0]
    case_groups.sort(key=lambda c: (c["next_hearing_date"], -c["open_count"]))

    total_open = sum(c["open_count"] for c in case_groups)

    return jsonify({
        "case_groups": case_groups,
        "total_open": total_open,
        "total_cases": len(case_groups),
    })


@app.route("/api/diary")
@login_required
def court_diary():
    advocate_id = g.advocate_id
    date_str = (request.args.get("date") or "").strip()
    try:
        selected_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else datetime.now().date()
    except ValueError:
        selected_date = datetime.now().date()

    selected_date_str = selected_date.strftime("%Y-%m-%d")
    prev_date_str = (selected_date - timedelta(days=1)).strftime("%Y-%m-%d")
    next_date_str = (selected_date + timedelta(days=1)).strftime("%Y-%m-%d")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM advocates WHERE id=%s", (advocate_id,))
    advocate = cur.fetchone()

    cur.execute(
        """SELECT * FROM cases WHERE advocate_id=%s AND status='Active' AND next_hearing_date=%s
           ORDER BY court_name ASC, item_number ASC""",
        (advocate_id, selected_date_str),
    )
    hearings = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify({
        "advocate": advocate_public(advocate),
        "hearings": hearings,
        "selected_date": selected_date_str,
        "prev_date": prev_date_str,
        "next_date": next_date_str,
        "is_today": (selected_date_str == datetime.now().date().strftime("%Y-%m-%d")),
    })


@app.route("/api/export")
@login_required
def export_cases():
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT client_name, client_phone, client_email, case_number, court_name, case_type, next_hearing_date, notes, status FROM cases WHERE advocate_id=%s ORDER BY next_hearing_date ASC",
        (advocate_id,),
    )
    cases = cur.fetchall()
    cur.close()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Client Name", "Client Phone", "Client Email", "Case Number", "Court Name",
        "Case Type", "Next Hearing Date", "Notes", "Status"
    ])
    for case in cases:
        writer.writerow([
            case["client_name"],
            case["client_phone"] or "",
            case["client_email"] or "",
            case["case_number"],
            case["court_name"],
            case["case_type"] or "",
            case["next_hearing_date"],
            case["notes"] or "",
            case["status"]
        ])

    response = Response(output.getvalue(), mimetype="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=advo_buddy_cases_export.csv"
    return response


@app.route("/api/cases/<int:case_id>/tasks", methods=["GET"])
@login_required
def get_tasks(case_id):
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if not case:
        cur.close()
        conn.close()
        return jsonify({"error": "Unauthorized"}), 403
    cur.execute("SELECT * FROM case_tasks WHERE case_id=%s ORDER BY id ASC", (case_id,))
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify({"tasks": tasks})


@app.route("/api/cases/<int:case_id>/tasks", methods=["POST"])
@login_required
def add_task(case_id):
    advocate_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Missing parameter"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if not case:
        cur.close()
        conn.close()
        return jsonify({"error": "Unauthorized"}), 403

    cur.execute("INSERT INTO case_tasks (case_id, title) VALUES (%s, %s) RETURNING id", (case_id, title))
    task_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "task": {"id": task_id, "case_id": case_id, "title": title, "is_completed": 0}}), 201


@app.route("/api/case-tasks/<int:task_id>/toggle", methods=["POST"])
@login_required
def toggle_task(task_id):
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT t.id, t.is_completed, c.advocate_id
        FROM case_tasks t
        JOIN cases c ON t.case_id = c.id
        WHERE t.id=%s
    """, (task_id,))
    task = cur.fetchone()
    if not task or task["advocate_id"] != advocate_id:
        cur.close()
        conn.close()
        return jsonify({"error": "Unauthorized"}), 403
    new_state = 1 if not task["is_completed"] else 0
    cur.execute("UPDATE case_tasks SET is_completed=%s WHERE id=%s", (new_state, task_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "is_completed": new_state})


@app.route("/api/case-tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT t.id, c.advocate_id
        FROM case_tasks t
        JOIN cases c ON t.case_id = c.id
        WHERE t.id=%s
    """, (task_id,))
    task = cur.fetchone()
    if not task or task["advocate_id"] != advocate_id:
        cur.close()
        conn.close()
        return jsonify({"error": "Unauthorized"}), 403
    cur.execute("DELETE FROM case_tasks WHERE id=%s", (task_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/billing")
@login_required
def billing():
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM cases WHERE advocate_id=%s AND status != 'Deleted' ORDER BY created_at DESC", (advocate_id,))
    cases = cur.fetchall()
    cur.close()
    conn.close()

    total_agreed = 0
    total_collected = 0
    total_expenses = 0

    for case in cases:
        total_agreed += case.get("total_fee") or 0
        total_collected += case.get("fee_paid") or 0
        total_expenses += case.get("expenses") or 0

    total_pending = total_agreed - total_collected

    return jsonify({
        "cases": cases,
        "total_agreed": total_agreed,
        "total_collected": total_collected,
        "total_expenses": total_expenses,
        "total_pending": total_pending,
    })


# ============================================
# AI ASSISTANT & CASE ANALYSIS ENDPOINTS
# ============================================
import json

def _call_gemini_chat(message, formatted_history, system_instruction):
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        import requests
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        messages = [{"role": "system", "content": system_instruction}]
        for item in formatted_history:
            role = "assistant" if item.get("role") in ["assistant", "model"] else "user"
            content = item.get("parts", [""])[0] if item.get("parts") else ""
            messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": message})

        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7
        }
        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]

    api_key = os.environ.get("AI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("AI_API_KEY / GEMINI_API_KEY or GROQ_API_KEY is missing in backend environment variables.")
    import google.generativeai as genai
    genai.configure(api_key=api_key)

    configured_model = os.environ.get("AI_MODEL", "gemini-2.0-flash")
    candidate_models = [configured_model, "gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-1.5-flash-latest"]
    seen = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    last_error = None
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name=model_name, system_instruction=system_instruction)
            chat = model.start_chat(history=formatted_history)
            response = chat.send_message(message)
            return response.text
        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            if "404" in err_str or "not found" in err_str or "no longer available" in err_str:
                continue
            raise e
    if last_error:
        raise last_error


def _call_gemini_generate(prompt, system_instruction):
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if groq_api_key:
        import requests
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json"
        }
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ]
        model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {"type": "json_object"}
        }
        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]

    api_key = os.environ.get("AI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("AI_API_KEY / GEMINI_API_KEY or GROQ_API_KEY is missing in backend environment variables.")
    import google.generativeai as genai
    genai.configure(api_key=api_key)

    configured_model = os.environ.get("AI_MODEL", "gemini-2.0-flash")
    candidate_models = [configured_model, "gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-1.5-flash-latest"]
    seen = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    last_error = None
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(model_name=model_name, system_instruction=system_instruction)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            if "404" in err_str or "not found" in err_str or "no longer available" in err_str:
                continue
            raise e
    if last_error:
        raise last_error



@app.route("/api/chat", methods=["POST"])
@login_required
def ai_chat():
    try:
        data = request.get_json(silent=True) or {}
        message = (data.get("message") or "").strip()
        history = data.get("history") or []

        if not message:
            return jsonify({"error": "Message is required."}), 400

        system_instruction = (
            "You are Advo Buddy, a helpful, precise, and professional legal assistant chatbot. "
            "Give clear, practical answers about legal questions, procedures, drafting guidance, and case strategy. "
            "Always maintain a helpful legal context while reminding users that AI guidance is for research "
            "and operational support and does not replace official judicial rulings or binding legal opinions. "
            "Keep answers well-structured, formatted cleanly with markdown when helpful."
        )

        formatted_history = []
        for item in history[:-1]:
            role = "model" if item.get("role") in ["assistant", "model"] else "user"
            text = item.get("text") or item.get("content") or ""
            if text:
                formatted_history.append({
                    "role": role,
                    "parts": [text]
                })

        reply = _call_gemini_chat(message, formatted_history, system_instruction)
        return jsonify({"reply": reply})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "resourceexhausted" in err_str.lower() or "quota" in err_str.lower():
            user_msg = "Google Gemini API rate limit or free quota exceeded (429). Please wait 30 seconds and try again, or create a fresh free key at https://aistudio.google.com/app/apikey."
            return jsonify({"error": user_msg}), 429
        print(f"AI Chat error: {e}")
        return jsonify({"error": f"Failed to get AI response: {err_str}"}), 500


@app.route("/api/analyze-case", methods=["POST"])
@login_required
def analyze_case():
    try:
        if "caseFile" not in request.files:
            return jsonify({"error": "No file uploaded."}), 400

        file = request.files["caseFile"]
        if not file or file.filename == "":
            return jsonify({"error": "No file selected."}), 400

        filename = file.filename
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        extracted_text = ""

        if ext == "pdf":
            try:
                import pypdf
                reader = pypdf.PdfReader(file.stream)
                pages_text = [page.extract_text() or "" for page in reader.pages]
                extracted_text = "\n".join(pages_text)
            except Exception as pe:
                return jsonify({"error": f"Could not read PDF file: {str(pe)}"}), 400

        elif ext == "docx":
            try:
                import docx
                doc = docx.Document(file.stream)
                extracted_text = "\n".join([p.text for p in doc.paragraphs if p.text])
            except Exception as de:
                return jsonify({"error": f"Could not read DOCX file: {str(de)}"}), 400

        elif ext == "txt":
            try:
                extracted_text = file.read().decode("utf-8", errors="ignore")
            except Exception as te:
                return jsonify({"error": f"Could not read text file: {str(te)}"}), 400

        else:
            return jsonify({"error": "Unsupported file type. Please upload a PDF, DOCX, or TXT file."}), 400

        if not extracted_text or len(extracted_text.strip()) < 20:
            return jsonify({"error": "Could not extract meaningful text from the uploaded document."}), 400

        # Truncate text safely if too long
        MAX_CHARS = 30000
        trimmed_text = extracted_text[:MAX_CHARS] + "\n\n[Document truncated for analysis]" if len(extracted_text) > MAX_CHARS else extracted_text

        system_instruction = (
            "You are Advo Buddy's legal case analysis engine. Analyze the uploaded legal case document "
            "and respond ONLY in valid JSON with this exact structure, no markdown formatting fences: "
            '{"summary": "...", "keyParties": ["..."], "keyIssues": ["..."], '
            '"relevantSections": ["..."], "riskAssessment": "...", "recommendations": ["..."]}'
        )

        prompt = f"Analyze this legal case document:\n\n{trimmed_text}"
        raw_text = _call_gemini_generate(prompt, system_instruction)
        raw = (raw_text or "").strip()

        # Clean markdown code fences if model returned them despite instructions
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1]
            if raw.endswith("```"):
                raw = raw.rsplit("```", 1)[0]
            raw = raw.strip()

        try:
            analysis = json.loads(raw)
        except Exception:
            analysis = {"summary": raw, "keyParties": [], "keyIssues": [], "relevantSections": [], "riskAssessment": "", "recommendations": []}

        return jsonify({"fileName": filename, "analysis": analysis})

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "resourceexhausted" in err_str.lower() or "quota" in err_str.lower():
            user_msg = "Google Gemini API rate limit or free quota exceeded (429). Please wait 30 seconds and try again, or create a fresh free key at https://aistudio.google.com/app/apikey."
            return jsonify({"error": user_msg}), 429
        print(f"Case analysis error: {e}")
        return jsonify({"error": f"Failed to analyze document: {err_str}"}), 500


@app.route("/api/draftmitra/import", methods=["POST"])
@login_required
def draftmitra_import():
    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text")
        if not text or not isinstance(text, str):
            return jsonify({"error": "text is required"}), 400

        system_instruction = (
            "You convert Indian court petition/draft documents into fillable templates.\n"
            "Given the raw text of a legal draft, do this:\n"
            "1. Identify every variable part that changes per client/case — names, case numbers, dates, court name, addresses, offence sections, case-specific facts. Do NOT treat fixed legal boilerplate language as variable.\n"
            "2. Replace each variable part in the text with a placeholder token like {{field_id}} using short snake_case ids (e.g. {{petitioner_name}}, {{crime_no}}, {{court_name}}).\n"
            "3. Keep every other word of the original document EXACTLY as written — do not paraphrase, shorten, or reword the legal language.\n"
            "4. Preserve paragraph breaks (use \\n\\n between paragraphs/lines) and numbered clauses as in the original.\n"
            "5. Produce a short human-readable label for each field, and a 2-4 word document title and a one-line subtitle (e.g. \"u/s 480 B.N.S.S.\" or \"Civil — rent dispute\").\n"
            "6. Also pick ONE category/group for this document from: \"Bail & Sureties\", \"Appearance & Vakalat\", \"Petitions\", \"Agreements\", \"Notices\", \"Affidavits\", \"Other\".\n\n"
            "Respond with ONLY valid JSON, no markdown fences, no commentary, in exactly this shape:\n"
            "{\"name\":\"...\",\"sub\":\"...\",\"group\":\"...\",\"template\":\"...text with {{field_id}} tokens and \\n\\n paragraph breaks...\",\"fields\":[{\"id\":\"field_id\",\"label\":\"Human label\"}]}"
        )

        response_text = _call_gemini_generate(text[:12000], system_instruction)
        cleaned = (response_text or "").strip()

        # Clean markdown code fences if model returned them despite instructions
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("```", 1)[0]
            cleaned = cleaned.strip()

        import json
        try:
            parsed = json.loads(cleaned)
        except Exception:
            return jsonify({"error": "Failed to parse AI response as valid JSON", "raw": cleaned}), 422

        if not parsed.get("template") or not isinstance(parsed.get("fields"), list):
            return jsonify({"error": "AI response did not match the required format structure."}), 422

        return jsonify(parsed)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "resourceexhausted" in err_str.lower() or "quota" in err_str.lower():
            user_msg = "Google Gemini API rate limit or free quota exceeded (429). Please wait 30 seconds and try again."
            return jsonify({"error": user_msg}), 429
        print(f"DraftMitra import error: {e}")
        return jsonify({"error": f"Failed to import draft: {err_str}"}), 500


# ============================================
# LAW STUDENT PORTAL API ENDPOINTS
# ============================================

LEGAL_MAXIMS = [
    {
        "maxim": "Audi Alteram Partem",
        "meaning": "Listen to the other side / No person shall be condemned unheard",
        "branch": "Natural Justice & Administrative Law",
        "landmark_case": "Maneka Gandhi v. Union of India (1978)",
        "explanation": "Fundamental principle of natural justice mandating a fair opportunity to present defense before an adverse decision is rendered."
    },
    {
        "maxim": "Nemo Judex In Causa Sua",
        "meaning": "No one should be a judge in their own cause (Rule against bias)",
        "branch": "Natural Justice & Constitutional Law",
        "landmark_case": "A.K. Kraipak v. Union of India (1969)",
        "explanation": "Ensures impartiality in judicial and quasi-judicial determinations; any pecuniary or personal bias disqualifies the adjudicator."
    },
    {
        "maxim": "Damnum Sine Injuria",
        "meaning": "Damage without legal injury / violation of a legal right",
        "branch": "Law of Torts",
        "landmark_case": "Gloucester Grammar School Case (1410)",
        "explanation": "No cause of action arises for monetary or commercial losses unless an enforceable legal right has been violated."
    },
    {
        "maxim": "Injuria Sine Damno",
        "meaning": "Violation of a legal right without actual physical/monetary damage",
        "branch": "Law of Torts & Constitutional Writs",
        "landmark_case": "Ashby v. White (1703) / Bhim Singh v. State of J&K (1985)",
        "explanation": "Actionable per se; infringement of an absolute private legal right gives rise to remedy even without monetary harm."
    },
    {
        "maxim": "Actus Non Facit Reum Nisi Mens Sit Rea",
        "meaning": "An act does not make a person guilty unless the mind is also guilty",
        "branch": "Criminal Law & BNS",
        "landmark_case": "State of Maharashtra v. Mayer Hans George (1965)",
        "explanation": "Both wrongful overt action (actus reus) and culpable mental state (mens rea) are required for criminal conviction."
    },
    {
        "maxim": "Res Ipsa Loquitur",
        "meaning": "The thing speaks for itself",
        "branch": "Law of Torts & Evidence",
        "landmark_case": "Municipal Corporation of Delhi v. Subhagwanti (1966)",
        "explanation": "Rule of evidence shifting the burden of proof to defendant when accident causes are exclusively under their management and wouldn't happen without negligence."
    },
    {
        "maxim": "Ubi Jus Ibi Remedium",
        "meaning": "Where there is a right, there is a remedy",
        "branch": "Jurisprudence & Constitutional Writs",
        "landmark_case": "Sardar Amarjit Singh Kalra v. Pramod Gupta (2003)",
        "explanation": "Courts must fashion effective remedies whenever substantive legal rights are breached."
    },
    {
        "maxim": "Volenti Non Fit Injuria",
        "meaning": "To a willing person, injury is not done (Consent as defense)",
        "branch": "Law of Torts",
        "landmark_case": "Hall v. Brooklands Auto Racing Club (1933)",
        "explanation": "One who voluntarily engages in known risks cannot maintain an action in tort for resulting harm."
    }
]

STUDY_DECK_DATA = {
    "constitution": [
        {"title": "Article 14", "subtitle": "Equality Before Law & Equal Protection", "details": "Prohibits arbitrary state action; guarantees reasonable classification with rational nexus to object sought (EP Royappa test of non-arbitrariness).", "tag": "Fundamental Rights"},
        {"title": "Article 19(1)(a)", "subtitle": "Freedom of Speech and Expression", "details": "Includes right to information, press freedom, right to remain silent; subject to reasonable restrictions under Art. 19(2).", "tag": "Fundamental Rights"},
        {"title": "Article 21", "subtitle": "Protection of Life & Personal Liberty", "details": "Interpreted broadly to include privacy (Puttaswamy), clean environment, speedy trial, livelihood (Olga Tellis), dignity and healthcare.", "tag": "Fundamental Rights"},
        {"title": "Article 32 & 226", "subtitle": "Constitutional Remedies & Writs", "details": "Habeas Corpus (unlawful detention), Mandamus (public duty), Quo Warranto (office title), Prohibition, Certiorari (quash jurisdiction excess).", "tag": "Writs"},
        {"title": "Basic Structure Doctrine", "subtitle": "Kesavananda Bharati (1973)", "details": "Parliament cannot alter fundamental pillars: Rule of Law, Judicial Review, Secularism, Democracy, Separation of Powers.", "tag": "Doctrine"},
        {"title": "Article 300A", "subtitle": "Right to Property as Constitutional Right", "details": "Moved from Fundamental Right (44th Amendment) to Constitutional/Human right; State cannot deprive property save by authority of law.", "tag": "Property"}
    ],
    "criminal_new_laws": [
        {"title": "BNS Section 103 vs IPC 302", "subtitle": "Punishment for Murder", "details": "BNS Sec 103 prescribes death or life imprisonment and fine. Adds specific provision for mob lynching (5+ persons on grounds of race, caste, community).", "tag": "BNS - Offence Against Life"},
        {"title": "BNS Section 64 vs IPC 376", "subtitle": "Punishment for Rape", "details": "BNS Sec 64 mandates rigorous imprisonment not less than 10 years extending to life; structured chapters with priority to crimes against women & children.", "tag": "BNS - Women"},
        {"title": "BNS Section 111", "subtitle": "Organized Crime (New Offence)", "details": "Statutory codification of organized crime syndicate activities, kidnapping, extortion, contract killing, cyber-crimes.", "tag": "BNS - Organized Crime"},
        {"title": "BNSS Section 480 vs CrPC 437", "subtitle": "Bail in Non-Bailable Offence", "details": "BNSS modernizes bail provisions, introduces timelines for trial and investigation, mandatory video-recording during search/seizure.", "tag": "BNSS - Bail"},
        {"title": "BSA Section 61 vs IEA 65B", "subtitle": "Electronic Records Admissibility", "details": "Bharatiya Sakshya Adhiniyam makes electronic/digital evidence primary evidence with certificate requirements aligned to modern computing.", "tag": "BSA - Evidence"}
    ],
    "maxims": LEGAL_MAXIMS
}


@app.route("/api/student/dashboard")
@login_required
def student_dashboard():
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()

    # Active Moots
    cur.execute("SELECT * FROM moot_courts WHERE student_id=%s ORDER BY created_at DESC", (student_id,))
    moots = cur.fetchall()
    active_moots = [m for m in moots if m.get("status") == "Active"]

    # Active Internships & Observation Logs
    cur.execute("SELECT * FROM internship_diaries WHERE student_id=%s ORDER BY created_at DESC", (student_id,))
    internships = cur.fetchall()
    active_internship = next((i for i in internships if i.get("status") == "Active"), None)

    cur.execute("SELECT count(*) AS log_count FROM internship_logs WHERE student_id=%s", (student_id,))
    total_observation_logs = cur.fetchone()["log_count"]

    # Case Briefs
    cur.execute("SELECT id, case_title, citation, court, subject, created_at FROM case_briefs WHERE student_id=%s ORDER BY created_at DESC", (student_id,))
    case_briefs = cur.fetchall()

    # Study Tasks
    cur.execute("SELECT * FROM student_study_tasks WHERE student_id=%s ORDER BY is_completed ASC, due_date ASC", (student_id,))
    tasks = cur.fetchall()
    pending_tasks = [t for t in tasks if not t.get("is_completed")]

    cur.close()
    conn.close()

    # Rotate Maxim based on day of year
    day_of_year = datetime.now().timetuple().tm_yday
    maxim_of_the_day = LEGAL_MAXIMS[day_of_year % len(LEGAL_MAXIMS)]

    # Upcoming Deadlines (Moots + Tasks)
    deadlines = []
    today_str = datetime.now().strftime("%Y-%m-%d")
    for m in active_moots:
        if m.get("memorial_deadline"):
            deadlines.append({
                "type": "Moot Memorial",
                "title": f"{m['title']} - Memorial Submission",
                "date": m["memorial_deadline"],
                "side": m.get("side"),
                "badge": "Memorial Due"
            })
        if m.get("competition_date"):
            deadlines.append({
                "type": "Moot Oral Rounds",
                "title": f"{m['title']} - Oral Competition",
                "date": m["competition_date"],
                "side": m.get("side"),
                "badge": "Oral Rounds"
            })

    for t in pending_tasks:
        if t.get("due_date"):
            deadlines.append({
                "type": t.get("task_type") or "Study Task",
                "title": f"{t['subject']}: {t['topic']}",
                "date": t["due_date"],
                "priority": t.get("priority"),
                "badge": t.get("task_type") or "Assignment"
            })

    deadlines.sort(key=lambda d: d["date"] or "9999-99-99")

    return jsonify({
        "active_moots_count": len(active_moots),
        "total_moots_count": len(moots),
        "active_internship": active_internship,
        "total_observation_logs": total_observation_logs,
        "case_briefs_count": len(case_briefs),
        "recent_briefs": case_briefs[:5],
        "pending_tasks_count": len(pending_tasks),
        "recent_tasks": tasks[:6],
        "upcoming_deadlines": deadlines[:8],
        "maxim_of_the_day": maxim_of_the_day,
    })


# --- Moot Courts ---

@app.route("/api/student/moots", methods=["GET"])
@login_required
def get_student_moots():
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM moot_courts WHERE student_id=%s ORDER BY created_at DESC", (student_id,))
    moots = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify({"moots": moots})


@app.route("/api/student/moots", methods=["POST"])
@login_required
def create_student_moot():
    student_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Moot title is required."}), 400

    organizer = (data.get("organizer") or "").strip()
    side = (data.get("side") or "").strip()
    team_members = (data.get("team_members") or "").strip()
    memorial_deadline = data.get("memorial_deadline") or ""
    competition_date = data.get("competition_date") or ""
    proposition_summary = (data.get("proposition_summary") or "").strip()
    memorial_notes = (data.get("memorial_notes") or "").strip()
    bench_questions = (data.get("bench_questions") or "").strip()
    status = data.get("status") or "Active"
    result = (data.get("result") or "").strip()

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO moot_courts
           (student_id, title, organizer, side, team_members, memorial_deadline,
            competition_date, proposition_summary, memorial_notes, bench_questions, status, result)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (student_id, title, organizer, side, team_members, memorial_deadline,
         competition_date, proposition_summary, memorial_notes, bench_questions, status, result),
    )
    new_id = cur.fetchone()["id"]
    conn.commit()

    cur.execute("SELECT * FROM moot_courts WHERE id=%s", (new_id,))
    moot = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"moot": moot, "message": "Moot competition tracked successfully!"}), 201


@app.route("/api/student/moots/<int:moot_id>", methods=["GET"])
@login_required
def get_student_moot_detail(moot_id):
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM moot_courts WHERE id=%s AND student_id=%s", (moot_id, student_id))
    moot = cur.fetchone()
    cur.close()
    conn.close()
    if not moot:
        return jsonify({"error": "Moot not found."}), 404
    return jsonify({"moot": moot})


@app.route("/api/student/moots/<int:moot_id>", methods=["PUT"])
@login_required
def update_student_moot(moot_id):
    student_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Moot title is required."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM moot_courts WHERE id=%s AND student_id=%s", (moot_id, student_id))
    if not cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Moot not found."}), 404

    cur.execute(
        """UPDATE moot_courts SET title=%s, organizer=%s, side=%s, team_members=%s,
           memorial_deadline=%s, competition_date=%s, proposition_summary=%s,
           memorial_notes=%s, bench_questions=%s, status=%s, result=%s
           WHERE id=%s AND student_id=%s""",
        (title, data.get("organizer", "").strip(), data.get("side", "").strip(),
         data.get("team_members", "").strip(), data.get("memorial_deadline", ""),
         data.get("competition_date", ""), data.get("proposition_summary", "").strip(),
         data.get("memorial_notes", "").strip(), data.get("bench_questions", "").strip(),
         data.get("status", "Active"), data.get("result", "").strip(), moot_id, student_id),
    )
    conn.commit()

    cur.execute("SELECT * FROM moot_courts WHERE id=%s", (moot_id,))
    moot = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"moot": moot, "message": "Moot competition updated!"})


@app.route("/api/student/moots/<int:moot_id>", methods=["DELETE"])
@login_required
def delete_student_moot(moot_id):
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM moot_courts WHERE id=%s AND student_id=%s", (moot_id, student_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "message": "Moot record removed."})


# --- Internship & Court Observation Diaries ---

@app.route("/api/student/internships", methods=["GET"])
@login_required
def get_student_internships():
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT i.*, count(l.id) AS log_count
        FROM internship_diaries i
        LEFT JOIN internship_logs l ON i.id = l.diary_id
        WHERE i.student_id=%s
        GROUP BY i.id
        ORDER BY i.created_at DESC
    """, (student_id,))
    internships = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify({"internships": internships})


@app.route("/api/student/internships", methods=["POST"])
@login_required
def create_student_internship():
    student_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    org = (data.get("organization") or "").strip()
    if not org:
        return jsonify({"error": "Organization / Chamber name is required."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO internship_diaries
           (student_id, organization, mentor_name, internship_type, start_date, end_date, stipend, summary, status)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (student_id, org, (data.get("mentor_name") or "").strip(),
         (data.get("internship_type") or "Advocate Chamber").strip(),
         data.get("start_date") or "", data.get("end_date") or "",
         (data.get("stipend") or "").strip(), (data.get("summary") or "").strip(),
         data.get("status") or "Active"),
    )
    new_id = cur.fetchone()["id"]
    conn.commit()

    cur.execute("SELECT * FROM internship_diaries WHERE id=%s", (new_id,))
    diary = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"internship": diary, "message": "Internship diary created!"}), 201


@app.route("/api/student/internships/<int:diary_id>", methods=["GET"])
@login_required
def get_student_internship_detail(diary_id):
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM internship_diaries WHERE id=%s AND student_id=%s", (diary_id, student_id))
    diary = cur.fetchone()
    if not diary:
        cur.close()
        conn.close()
        return jsonify({"error": "Internship not found."}), 404

    cur.execute("SELECT * FROM internship_logs WHERE diary_id=%s AND student_id=%s ORDER BY log_date DESC, id DESC", (diary_id, student_id))
    logs = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify({"internship": diary, "logs": logs})


@app.route("/api/student/internships/<int:diary_id>", methods=["PUT"])
@login_required
def update_student_internship(diary_id):
    student_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    org = (data.get("organization") or "").strip()
    if not org:
        return jsonify({"error": "Organization name is required."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """UPDATE internship_diaries SET organization=%s, mentor_name=%s, internship_type=%s,
           start_date=%s, end_date=%s, stipend=%s, summary=%s, status=%s
           WHERE id=%s AND student_id=%s""",
        (org, (data.get("mentor_name") or "").strip(),
         (data.get("internship_type") or "Advocate Chamber").strip(),
         data.get("start_date") or "", data.get("end_date") or "",
         (data.get("stipend") or "").strip(), (data.get("summary") or "").strip(),
         data.get("status") or "Active", diary_id, student_id),
    )
    conn.commit()
    cur.execute("SELECT * FROM internship_diaries WHERE id=%s", (diary_id,))
    diary = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"internship": diary, "message": "Internship details updated!"})


@app.route("/api/student/internships/<int:diary_id>", methods=["DELETE"])
@login_required
def delete_student_internship(diary_id):
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM internship_logs WHERE diary_id=%s AND student_id=%s", (diary_id, student_id))
    cur.execute("DELETE FROM internship_diaries WHERE id=%s AND student_id=%s", (diary_id, student_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "message": "Internship diary deleted."})


@app.route("/api/student/internships/<int:diary_id>/logs", methods=["POST"])
@login_required
def add_internship_observation_log(diary_id):
    student_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    log_date = data.get("log_date") or datetime.now().strftime("%Y-%m-%d")

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM internship_diaries WHERE id=%s AND student_id=%s", (diary_id, student_id))
    if not cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Internship diary not found."}), 404

    cur.execute(
        """INSERT INTO internship_logs
           (diary_id, student_id, log_date, court_hall, case_observed, advocate_arguing, proceedings_summary, key_learnings)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (diary_id, student_id, log_date, (data.get("court_hall") or "").strip(),
         (data.get("case_observed") or "").strip(), (data.get("advocate_arguing") or "").strip(),
         (data.get("proceedings_summary") or "").strip(), (data.get("key_learnings") or "").strip()),
    )
    log_id = cur.fetchone()["id"]
    conn.commit()

    cur.execute("SELECT * FROM internship_logs WHERE id=%s", (log_id,))
    new_log = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"log": new_log, "message": "Daily court observation logged!"}), 201


@app.route("/api/student/internship-logs/<int:log_id>", methods=["DELETE"])
@login_required
def delete_internship_log(log_id):
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM internship_logs WHERE id=%s AND student_id=%s", (log_id, student_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "message": "Log entry deleted."})


# --- FIRAC Case Briefs ---

@app.route("/api/student/case-briefs", methods=["GET"])
@login_required
def get_student_case_briefs():
    student_id = g.advocate_id
    subject_filter = (request.args.get("subject") or "").strip()
    search = (request.args.get("search") or "").strip().lower()

    conn = get_db()
    cur = conn.cursor()
    if subject_filter:
        cur.execute("SELECT * FROM case_briefs WHERE student_id=%s AND subject=%s ORDER BY created_at DESC", (student_id, subject_filter))
    else:
        cur.execute("SELECT * FROM case_briefs WHERE student_id=%s ORDER BY created_at DESC", (student_id,))
    briefs = cur.fetchall()
    cur.close()
    conn.close()

    if search:
        briefs = [
            b for b in briefs
            if search in (b.get("case_title") or "").lower() or
               search in (b.get("citation") or "").lower() or
               search in (b.get("subject") or "").lower() or
               search in (b.get("tags") or "").lower()
        ]

    return jsonify({"case_briefs": briefs})


@app.route("/api/student/case-briefs", methods=["POST"])
@login_required
def create_student_case_brief():
    student_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    title = (data.get("case_title") or "").strip()
    if not title:
        return jsonify({"error": "Case title is required."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO case_briefs
           (student_id, case_title, citation, court, subject, facts, issues,
            rule_of_law, analysis_arguments, conclusion_judgment, ratio_decidendi, obiter_dicta, tags)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (student_id, title, (data.get("citation") or "").strip(),
         (data.get("court") or "").strip(), (data.get("subject") or "Constitutional Law").strip(),
         (data.get("facts") or "").strip(), (data.get("issues") or "").strip(),
         (data.get("rule_of_law") or "").strip(), (data.get("analysis_arguments") or "").strip(),
         (data.get("conclusion_judgment") or "").strip(), (data.get("ratio_decidendi") or "").strip(),
         (data.get("obiter_dicta") or "").strip(), (data.get("tags") or "").strip()),
    )
    new_id = cur.fetchone()["id"]
    conn.commit()

    cur.execute("SELECT * FROM case_briefs WHERE id=%s", (new_id,))
    brief = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"case_brief": brief, "message": "Case brief saved!"}), 201


@app.route("/api/student/case-briefs/<int:brief_id>", methods=["GET"])
@login_required
def get_student_case_brief_detail(brief_id):
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM case_briefs WHERE id=%s AND student_id=%s", (brief_id, student_id))
    brief = cur.fetchone()
    cur.close()
    conn.close()
    if not brief:
        return jsonify({"error": "Case brief not found."}), 404
    return jsonify({"case_brief": brief})


@app.route("/api/student/case-briefs/<int:brief_id>", methods=["PUT"])
@login_required
def update_student_case_brief(brief_id):
    student_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    title = (data.get("case_title") or "").strip()
    if not title:
        return jsonify({"error": "Case title is required."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """UPDATE case_briefs SET case_title=%s, citation=%s, court=%s, subject=%s,
           facts=%s, issues=%s, rule_of_law=%s, analysis_arguments=%s, conclusion_judgment=%s,
           ratio_decidendi=%s, obiter_dicta=%s, tags=%s
           WHERE id=%s AND student_id=%s""",
        (title, (data.get("citation") or "").strip(),
         (data.get("court") or "").strip(), (data.get("subject") or "Constitutional Law").strip(),
         (data.get("facts") or "").strip(), (data.get("issues") or "").strip(),
         (data.get("rule_of_law") or "").strip(), (data.get("analysis_arguments") or "").strip(),
         (data.get("conclusion_judgment") or "").strip(), (data.get("ratio_decidendi") or "").strip(),
         (data.get("obiter_dicta") or "").strip(), (data.get("tags") or "").strip(),
         brief_id, student_id),
    )
    conn.commit()

    cur.execute("SELECT * FROM case_briefs WHERE id=%s", (brief_id,))
    brief = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"case_brief": brief, "message": "Case brief updated!"})


@app.route("/api/student/case-briefs/<int:brief_id>", methods=["DELETE"])
@login_required
def delete_student_case_brief(brief_id):
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM case_briefs WHERE id=%s AND student_id=%s", (brief_id, student_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "message": "Case brief deleted."})


@app.route("/api/student/case-briefs/ai-generate", methods=["POST"])
@login_required
def ai_generate_case_brief():
    try:
        data = request.get_json(silent=True) or {}
        case_input = (data.get("case_input") or data.get("query") or data.get("text") or "").strip()
        if not case_input:
            return jsonify({"error": "Please provide a case name, citation, or judgment excerpt."}), 400

        system_instruction = (
            "You are an expert Indian Legal Scholar and Law School Professor. "
            "Your task is to generate a comprehensive, highly accurate FIRAC (Facts, Issues, Rules, Analysis, Conclusion) "
            "Case Brief for law students based on the provided case name, citation, or raw judgment text.\n\n"
            "Return ONLY valid JSON (no markdown formatting fences, no extra text) in this exact structure:\n"
            "{\n"
            '  "case_title": "Case Title (e.g. Kesavananda Bharati v. State of Kerala)",\n'
            '  "citation": "Official Citation (e.g. (1973) 4 SCC 225)",\n'
            '  "court": "Court and Bench (e.g. Supreme Court of India - 13 Judge Bench)",\n'
            '  "subject": "Law Subject (e.g. Constitutional Law / Criminal Law / Law of Torts / Contracts / Family Law)",\n'
            '  "facts": "Concise chronological summary of material facts...",\n'
            '  "issues": "Numbered legal questions framed before the court...",\n'
            '  "rule_of_law": "Key constitutional provisions, statutory sections, or doctrines applied...",\n'
            '  "analysis_arguments": "Detailed judicial reasoning, petitioner/respondent arguments...",\n'
            '  "conclusion_judgment": "Final outcome, order passed by majority...",\n'
            '  "ratio_decidendi": "The binding core legal principle established...",\n'
            '  "obiter_dicta": "Significant passing remarks or observations...",\n'
            '  "tags": "Comma-separated keywords (e.g. Basic Structure, Article 368, Judicial Review)"\n'
            "}"
        )

        prompt = f"Generate an exhaustive law student FIRAC Case Brief for:\n\n{case_input[:12000]}"
        raw_text = _call_gemini_generate(prompt, system_instruction)
        cleaned = (raw_text or "").strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("```", 1)[0]
            cleaned = cleaned.strip()

        parsed = json.loads(cleaned)
        return jsonify({"case_brief": parsed})

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "resourceexhausted" in err_str.lower() or "quota" in err_str.lower():
            user_msg = "AI rate limit reached. Please try again in 30 seconds."
            return jsonify({"error": user_msg}), 429
        return jsonify({"error": f"Failed to generate case brief: {err_str}"}), 500


# --- Student Study Tasks ---

@app.route("/api/student/study-tasks", methods=["GET"])
@login_required
def get_student_study_tasks():
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM student_study_tasks WHERE student_id=%s ORDER BY is_completed ASC, due_date ASC", (student_id,))
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify({"tasks": tasks})


@app.route("/api/student/study-tasks", methods=["POST"])
@login_required
def create_student_study_task():
    student_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    subject = (data.get("subject") or "").strip()
    topic = (data.get("topic") or "").strip()
    if not subject or not topic:
        return jsonify({"error": "Subject and topic are required."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO student_study_tasks (student_id, subject, topic, due_date, priority, task_type)
           VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
        (student_id, subject, topic, data.get("due_date") or "",
         data.get("priority") or "Medium", data.get("task_type") or "Assignment"),
    )
    new_id = cur.fetchone()["id"]
    conn.commit()

    cur.execute("SELECT * FROM student_study_tasks WHERE id=%s", (new_id,))
    task = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"task": task, "message": "Study task added!"}), 201


@app.route("/api/student/study-tasks/<int:task_id>/toggle", methods=["POST"])
@login_required
def toggle_student_study_task(task_id):
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT is_completed FROM student_study_tasks WHERE id=%s AND student_id=%s", (task_id, student_id))
    task = cur.fetchone()
    if not task:
        cur.close()
        conn.close()
        return jsonify({"error": "Task not found."}), 404

    new_state = 1 if not task["is_completed"] else 0
    cur.execute("UPDATE student_study_tasks SET is_completed=%s WHERE id=%s", (new_state, task_id))
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"success": True, "is_completed": new_state})


@app.route("/api/student/study-tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_student_study_task(task_id):
    student_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM student_study_tasks WHERE id=%s AND student_id=%s", (task_id, student_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "message": "Task removed."})


# --- Study Deck ---

@app.route("/api/student/study-deck")
@login_required
def get_student_study_deck():
    return jsonify(STUDY_DECK_DATA)


# --- AI Student Legal Tutor ---

@app.route("/api/student/ai-tutor", methods=["POST"])
@login_required
def student_ai_tutor():
    try:
        data = request.get_json(silent=True) or {}
        message = (data.get("message") or "").strip()
        history = data.get("history") or []

        if not message:
            return jsonify({"error": "Question or prompt is required."}), 400

        system_instruction = (
            "You are 'Professor Advo', an inspiring, patient, and brilliant Law Professor and Legal Mentor "
            "at top National Law Universities (NLUs) in India. You guide law students with:\n"
            "1. Deep Socratic clarity on Indian Jurisprudence, Constitution, new Bharatiya Nyaya Sanhita (BNS), BNSS, BSA, Contracts, Torts, and CPC.\n"
            "2. Landmark Supreme Court & High Court case law citations with clear ratio decidendi and bench size.\n"
            "3. Moot Court Memorial structuring, framing issues, rebuttal formulation, and bench questions.\n"
            "4. Practical exam answer structuring using the FIRAC / IRAC technique.\n"
            "5. Comparing old colonial statutes (IPC, CrPC, IEA) with the newly enacted criminal laws.\n\n"
            "Keep explanations engaging, structured with markdown headings, bullet points, and real-world analogies. "
            "Always motivate the student and encourage sharp analytical thinking!"
        )

        formatted_history = []
        for item in history[:-1]:
            role = "model" if item.get("role") in ["assistant", "model"] else "user"
            text = item.get("text") or item.get("content") or ""
            if text:
                formatted_history.append({"role": role, "parts": [text]})

        reply = _call_gemini_chat(message, formatted_history, system_instruction)
        return jsonify({"reply": reply})
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "resourceexhausted" in err_str.lower() or "quota" in err_str.lower():
            user_msg = "AI Tutor is experiencing high traffic. Please wait 30 seconds."
            return jsonify({"error": user_msg}), 429
        return jsonify({"error": f"Failed to get response: {err_str}"}), 500


# ==========================================
# eCourts Search & Import APIs
# ==========================================

@app.route("/api/ecourts/meta", methods=["GET"])
def ecourts_metadata():
    """
    Returns available States, Districts, and Case Type taxonomy.
    """
    try:
        data = get_ecourts_metadata()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve eCourts metadata: {str(e)}"}), 500


@app.route("/api/ecourts/start-search", methods=["POST"])
def ecourts_start_search():
    """
    Initiates an eCourts search session for an Advocate Bar Registration Number,
    optionally scoped to a State, District Court, and Case Type.
    Returns session ID and a visual CAPTCHA image.
    """
    try:
        data = request.get_json(silent=True) or {}
        bar_number = data.get("barNumber") or data.get("bar_number") or ""
        state = data.get("state") or ""
        district = data.get("district") or ""
        court_complex = data.get("courtComplex") or data.get("court_complex") or ""
        case_type = data.get("caseType") or data.get("case_type") or ""

        if not bar_number.strip():
            return jsonify({"error": "Please enter an Advocate Bar Registration Number (e.g. MS/4321/2018)."}), 400

        result = start_ecourts_search(
            bar_number=bar_number,
            state=state,
            district=district,
            court_complex=court_complex,
            case_type=case_type,
        )
        return jsonify(result)
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Could not initiate eCourts search: {str(e)}"}), 500


@app.route("/api/ecourts/refresh-captcha", methods=["POST"])
def ecourts_refresh_captcha():
    """
    Refreshes the CAPTCHA image for an active search session.
    """
    try:
        data = request.get_json(silent=True) or {}
        session_id = data.get("sessionId") or data.get("session_id") or ""
        if not session_id:
            return jsonify({"error": "Session ID is required."}), 400

        result = refresh_ecourts_captcha(session_id)
        return jsonify(result)
    except KeyError as ke:
        return jsonify({"error": str(ke)}), 404
    except Exception as e:
        return jsonify({"error": f"Failed to refresh captcha: {str(e)}"}), 500


@app.route("/api/ecourts/submit-captcha", methods=["POST"])
def ecourts_submit_captcha():
    """
    Submits user-entered CAPTCHA text. Returns either retry status with new captcha
    or success status with the list of retrieved court cases.
    """
    try:
        data = request.get_json(silent=True) or {}
        session_id = data.get("sessionId") or data.get("session_id") or ""
        captcha_text = data.get("captchaText") or data.get("captcha_text") or ""
        advocate_name = data.get("advocateName") or data.get("advocate_name") or ""

        if not session_id:
            return jsonify({"error": "Session ID is required."}), 400
        if not captcha_text.strip():
            return jsonify({"error": "Please type the letters shown in the CAPTCHA image."}), 400

        result = submit_ecourts_captcha(
            session_id=session_id,
            user_captcha_text=captcha_text,
            advocate_name=advocate_name,
        )
        return jsonify(result)
    except KeyError as ke:
        return jsonify({"error": str(ke)}), 404
    except Exception as e:
        return jsonify({"error": f"eCourts verification failed: {str(e)}"}), 500


@app.route("/api/ecourts/import", methods=["POST"])
@login_required
def ecourts_import_cases():
    """
    Imports a list of verified eCourts cases into the advocate's Advo Buddy diary.
    Avoids duplicate entries and registers initial hearing history.
    """
    advocate_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    raw_cases = data.get("cases") or []

    if not raw_cases:
        return jsonify({"error": "No cases provided for import."}), 400

    conn = get_db()
    cur = conn.cursor()

    imported_count = 0
    updated_count = 0
    all_conflicts = set()

    for c in raw_cases:
        case_number = (c.get("case_number") or "").strip()
        if not case_number:
            continue

        client_name = (c.get("client_name") or c.get("parties") or "Client").strip()
        client_phone = (c.get("client_phone") or "").strip()
        client_email = (c.get("client_email") or "").strip()
        court_name = (c.get("court_name") or "District Court").strip()
        case_type = (c.get("case_type") or "Civil").strip()
        next_hearing_date = (c.get("next_hearing_date") or datetime.now().strftime("%Y-%m-%d")).strip()
        notes = (c.get("notes") or "").strip()
        opposing_counsel = (c.get("opposing_counsel") or "").strip()
        opposing_counsel_phone = (c.get("opposing_counsel_phone") or "").strip()
        judge_name = (c.get("judge_name") or "").strip()
        court_hall = (c.get("court_hall") or "").strip()
        item_number = (c.get("item_number") or "").strip()
        case_stage = (c.get("case_stage") or "").strip()
        total_fee = int(c.get("total_fee") or 0)
        fee_paid = int(c.get("fee_paid") or 0)
        expenses = int(c.get("expenses") or 0)

        # Check for hearing date conflict
        conflicts = check_hearing_conflict(conn, advocate_id, court_name, next_hearing_date)
        if conflicts:
            for conf_num in conflicts:
                all_conflicts.add(f"'{case_number}' clashes on {next_hearing_date} with '{conf_num}' at {court_name}")

        # Check if already in database for this advocate
        cur.execute(
            "SELECT id FROM cases WHERE advocate_id=%s AND case_number=%s",
            (advocate_id, case_number),
        )
        existing = cur.fetchone()

        if existing:
            # Update existing case details with latest eCourts data
            case_id = existing["id"]
            cur.execute(
                """UPDATE cases SET client_name=%s, court_name=%s, case_type=%s,
                                   next_hearing_date=%s, opposing_counsel=%s,
                                   opposing_counsel_phone=%s, judge_name=%s,
                                   court_hall=%s, item_number=%s, case_stage=%s, notes=%s
                   WHERE id=%s AND advocate_id=%s""",
                (client_name, court_name, case_type, next_hearing_date,
                 opposing_counsel, opposing_counsel_phone, judge_name,
                 court_hall, item_number, case_stage, notes, case_id, advocate_id),
            )
            updated_count += 1
        else:
            # Insert new case
            cur.execute(
                """INSERT INTO cases (advocate_id, client_name, client_phone, client_email,
                                     case_number, court_name, case_type, next_hearing_date,
                                     notes, notify_client, opposing_counsel, opposing_counsel_phone,
                                     judge_name, court_hall, item_number, case_stage,
                                     total_fee, fee_paid, expenses)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   RETURNING id""",
                (advocate_id, client_name, client_phone, client_email, case_number,
                 court_name, case_type, next_hearing_date, notes, 0,
                 opposing_counsel, opposing_counsel_phone, judge_name, court_hall,
                 item_number, case_stage, total_fee, fee_paid, expenses),
            )
            new_case_id = cur.fetchone()["id"]
            add_history_entry(conn, new_case_id, next_hearing_date, note="Imported from eCourts Services")
            imported_count += 1

    conn.commit()
    cur.close()
    conn.close()

    msg = f"Successfully imported {imported_count} new case(s)"
    if updated_count > 0:
        msg += f" and updated {updated_count} existing case(s)"
    msg += " into your Advo Buddy diary."

    return jsonify({
        "imported_count": imported_count,
        "updated_count": updated_count,
        "total_processed": imported_count + updated_count,
        "conflicts": list(all_conflicts),
        "message": msg,
    })


if DATABASE_URL:
    init_db()
else:
    app.logger.info("Skipping database initialization because DATABASE_URL is not configured.")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)

