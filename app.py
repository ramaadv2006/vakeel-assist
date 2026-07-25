"""
Advo Buddy - Case & Hearing Tracker for Advocates (Multi-User Version)
Many advocates can sign up and use this app - each advocate only sees
their own cases. Built to save advocates time on manual diary management.

This is a pure JSON API. The frontend is a decoupled React (Vite) SPA
that lives in frontend/ and talks to these endpoints over fetch(). Auth
is stateless: POST /api/auth/login and /api/auth/signup return a signed
bearer token (itsdangerous) that the client stores and sends back as
`Authorization: Bearer <token>` on every subsequent request.
"""

from flask import Flask, request, jsonify, Response, g
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from datetime import datetime, timedelta
from functools import wraps
import csv
import io
import os
import sqlite3

try:
    import psycopg2
    import psycopg2.extras
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "advo-buddy-secret-key-change-this-in-production")

CORS(app, resources={r"/api/*": {"origins": "*"}})

DATABASE_URL = os.environ.get("DATABASE_URL")
STALE_CASE_DAYS = 60
AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30  # 30 days

UPLOAD_FOLDER = os.path.join(app.root_path, "static", "uploads", "avatars")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def get_serializer():
    return URLSafeTimedSerializer(app.secret_key)


# ---------- Auth token helpers (stateless, replaces Flask session) ----------

def generate_auth_token(advocate_id):
    return get_serializer().dumps({"id": advocate_id}, salt="auth-token")


def verify_auth_token(token):
    try:
        data = get_serializer().loads(token, salt="auth-token", max_age=AUTH_TOKEN_MAX_AGE)
        return data.get("id")
    except (SignatureExpired, BadSignature):
        return None


def generate_reset_token(email):
    return get_serializer().dumps(email, salt="password-reset-salt")


def verify_reset_token(token, max_age=3600):
    try:
        return get_serializer().loads(token, salt="password-reset-salt", max_age=max_age)
    except (SignatureExpired, BadSignature):
        return None


# Wrapper classes to make SQLite act like psycopg2 with RealDictCursor and %s placeholders
class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, query, params=None):
        query = query.replace('%s', '?')
        if "SERIAL PRIMARY KEY" in query:
            query = query.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")

        if params is not None:
            if not isinstance(params, (list, tuple)):
                params = (params,)
            self.cursor.execute(query, params)
        else:
            self.cursor.execute(query)
        return self

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(row) for row in rows]

    def close(self):
        self.cursor.close()


class SQLiteConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self):
        return SQLiteCursorWrapper(self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()


def get_db():
    if DATABASE_URL and HAS_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
        return conn
    else:
        db_path = os.path.join(os.path.dirname(__file__), "advo_buddy.db")
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return SQLiteConnectionWrapper(conn)


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

    if DATABASE_URL and HAS_POSTGRES:
        def col_exists(col):
            cur.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='cases' AND column_name=%s
            """, (col,))
            return cur.fetchone() is not None
    else:
        cur.execute("PRAGMA table_info(cases)")
        columns = [row['name'] for row in cur.fetchall()]

        def col_exists(col):
            return col in columns

    cols_to_add = [
        ("opposing_counsel", "TEXT"),
        ("opposing_counsel_phone", "TEXT"),
        ("judge_name", "TEXT"),
        ("court_hall", "TEXT"),
        ("item_number", "TEXT"),
        ("case_stage", "TEXT"),
        ("total_fee", "INTEGER DEFAULT 0"),
        ("fee_paid", "INTEGER DEFAULT 0"),
        ("expenses", "INTEGER DEFAULT 0")
    ]
    for col, col_type in cols_to_add:
        if not col_exists(col):
            cur.execute(f"ALTER TABLE cases ADD COLUMN {col} {col_type}")

    advocate_cols_to_add = [
        ("profile_image", "TEXT"),
        ("office_address", "TEXT"),
        ("specialization", "TEXT")
    ]
    for col, col_type in advocate_cols_to_add:
        if DATABASE_URL and HAS_POSTGRES:
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name='advocates' AND column_name=%s
            """, (col,))
            has_col = cur.fetchone() is not None
        else:
            cur.execute("PRAGMA table_info(advocates)")
            adv_cols = [row['name'] for row in cur.fetchall()]
            has_col = col in adv_cols

        if not has_col:
            cur.execute(f"ALTER TABLE advocates ADD COLUMN {col} {col_type}")

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

def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header[7:] if auth_header.startswith("Bearer ") else None
        advocate_id = verify_auth_token(token) if token else None
        if advocate_id is None:
            return jsonify({"error": "Please log in to continue."}), 401
        g.advocate_id = advocate_id
        return f(*args, **kwargs)
    return wrapper


@app.route("/")
def index():
    return jsonify({"service": "Advo Buddy API", "status": "ok"})


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    bar_number = (data.get("bar_council_number") or "").strip()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "Please fill all required fields."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password should be at least 6 characters."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM advocates WHERE email=%s", (email,))
    existing = cur.fetchone()
    if existing:
        cur.close()
        conn.close()
        return jsonify({"error": "An account with this email already exists. Please log in."}), 409

    password_hash = generate_password_hash(password)
    cur.execute(
        """INSERT INTO advocates (name, email, phone, bar_council_number, password_hash)
           VALUES (%s, %s, %s, %s, %s) RETURNING id""",
        (name, email, phone, bar_number, password_hash),
    )
    advocate_id = cur.fetchone()["id"]
    conn.commit()

    cur.execute("SELECT * FROM advocates WHERE id=%s", (advocate_id,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()

    token = generate_auth_token(advocate_id)
    return jsonify({"token": token, "advocate": advocate_public(advocate)}), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM advocates WHERE email=%s", (email,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()

    if advocate is None or not check_password_hash(advocate["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = generate_auth_token(advocate["id"])
    return jsonify({"token": token, "advocate": advocate_public(advocate)})


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


@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Please enter your registered email address."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM advocates WHERE email=%s", (email,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()

    if advocate:
        token = generate_reset_token(email)
        # No email transport is configured for this project, so (same as the
        # original server-rendered flash message) we hand the reset link
        # straight back in the response for local/demo use.
        return jsonify({
            "message": f"Password reset link generated for {email}!",
            "reset_token": token,
        })

    return jsonify({"message": "If an account with that email exists, a password reset link has been generated."})


@app.route("/api/auth/reset-password/<token>", methods=["GET"])
def check_reset_token(token):
    email = verify_reset_token(token)
    if not email:
        return jsonify({"valid": False, "error": "The password reset link is invalid or has expired."}), 400
    return jsonify({"valid": True, "email": email})


@app.route("/api/auth/reset-password/<token>", methods=["POST"])
def reset_password(token):
    email = verify_reset_token(token)
    if not email:
        return jsonify({"error": "The password reset link is invalid or has expired. Please request a new one."}), 400

    data = request.get_json(silent=True) or {}
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""

    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    password_hash = generate_password_hash(password)
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE advocates SET password_hash=%s WHERE email=%s", (password_hash, email))
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Your password has been reset successfully! You can now log in."})


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
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    bar_number = (data.get("bar_council_number") or "").strip()
    office_address = (data.get("office_address") or "").strip()
    specialization = (data.get("specialization") or "").strip()
    reminder_method = data.get("reminder_method", "none")
    reminder_days_before = data.get("reminder_days_before", 1)

    if not name or not email:
        return jsonify({"error": "Name and email are required."}), 400

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id FROM advocates WHERE email=%s AND id!=%s", (email, g.advocate_id))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Another account is already using this email address."}), 409

    cur.execute(
        """UPDATE advocates SET name=%s, email=%s, phone=%s, bar_council_number=%s,
           office_address=%s, specialization=%s, reminder_method=%s, reminder_days_before=%s
           WHERE id=%s""",
        (name, email, phone, bar_number, office_address, specialization,
         reminder_method, reminder_days_before, g.advocate_id),
    )
    conn.commit()

    cur.execute("SELECT * FROM advocates WHERE id=%s", (g.advocate_id,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()

    return jsonify({"advocate": advocate_public(advocate), "message": "Profile and settings updated successfully!"})


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
        "SELECT * FROM cases WHERE advocate_id=%s ORDER BY client_name ASC",
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
    "client_name", "client_phone", "case_number", "court_name", "case_type",
    "next_hearing_date", "notes", "notify_client", "opposing_counsel",
    "opposing_counsel_phone", "judge_name", "court_hall", "item_number",
    "case_stage", "total_fee", "fee_paid", "expenses",
]


def _parse_case_payload(data):
    client_name = (data.get("client_name") or "").strip()
    client_phone = (data.get("client_phone") or "").strip()
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
           (advocate_id, client_name, client_phone, case_number, court_name, case_type, next_hearing_date, notes, notify_client,
            opposing_counsel, opposing_counsel_phone, judge_name, court_hall, item_number, case_stage, total_fee, fee_paid, expenses)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (advocate_id, f["client_name"], f["client_phone"], f["case_number"], f["court_name"], f["case_type"],
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
        """UPDATE cases SET client_name=%s, client_phone=%s, case_number=%s, court_name=%s,
           case_type=%s, next_hearing_date=%s, notes=%s, status=%s, notify_client=%s,
           opposing_counsel=%s, opposing_counsel_phone=%s, judge_name=%s, court_hall=%s,
           item_number=%s, case_stage=%s, total_fee=%s, fee_paid=%s, expenses=%s
           WHERE id=%s AND advocate_id=%s""",
        (f["client_name"], f["client_phone"], f["case_number"], f["court_name"], f["case_type"],
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


@app.route("/api/cases/<int:case_id>", methods=["DELETE"])
@login_required
def delete_case(case_id):
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        return jsonify({"error": "Case not found."}), 404

    cur.execute("DELETE FROM hearing_history WHERE case_id=%s", (case_id,))
    cur.execute("DELETE FROM case_audit_log WHERE case_id=%s", (case_id,))
    cur.execute("DELETE FROM case_tasks WHERE case_id=%s", (case_id,))
    cur.execute("DELETE FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"success": True, "message": "Case removed."})


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

    closed_cases = [c for c in archived_cases if c["status"] == "Closed"]
    onhold_cases = [c for c in archived_cases if c["status"] != "Closed"]

    return jsonify({
        "closed_cases": closed_cases,
        "onhold_cases": onhold_cases,
        "total_archived": len(archived_cases),
    })


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


@app.route("/api/cases/bulk-update-dates", methods=["POST"])
@login_required
def bulk_update_dates():
    advocate_id = g.advocate_id
    data = request.get_json(silent=True) or {}
    cause_list_text = (data.get("cause_list_text") or "").strip()

    if not cause_list_text:
        return jsonify({"error": "Please enter or paste cause list lines to import."}), 400

    lines = cause_list_text.splitlines()
    updated_count = 0
    unmatched_list = []
    conflict_warnings = []
    invalid_lines = []

    conn = get_db()
    cur = conn.cursor()

    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue

        parts = [p.strip() for p in line_str.split(",")]
        if len(parts) < 2:
            invalid_lines.append(line_str)
            continue

        case_num_input = parts[0]
        date_str_input = parts[1]

        try:
            parsed_date = datetime.strptime(date_str_input, "%Y-%m-%d").date()
            formatted_date = parsed_date.strftime("%Y-%m-%d")
        except ValueError:
            invalid_lines.append(f"{line_str} (invalid date, expected YYYY-MM-DD)")
            continue

        cur.execute(
            "SELECT * FROM cases WHERE advocate_id=%s AND LOWER(TRIM(case_number)) = LOWER(%s)",
            (advocate_id, case_num_input),
        )
        matching_cases = cur.fetchall()

        if not matching_cases:
            unmatched_list.append(case_num_input)
        else:
            for c in matching_cases:
                case_id = c["id"]
                court_name = c["court_name"]

                cur.execute(
                    "UPDATE cases SET next_hearing_date=%s WHERE id=%s AND advocate_id=%s",
                    (formatted_date, case_id, advocate_id),
                )
                add_history_entry(conn, case_id, formatted_date, note="Bulk cause list import")
                updated_count += 1

                conflicts = check_hearing_conflict(conn, advocate_id, court_name, formatted_date, exclude_case_id=case_id)
                if conflicts:
                    c_str = ", ".join(conflicts)
                    conflict_warnings.append(f"Case '{c['case_number']}' on {formatted_date} conflicts with active case(s) {c_str} at '{court_name}'")

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "updated_count": updated_count,
        "unmatched_list": unmatched_list,
        "invalid_lines": invalid_lines,
        "conflict_warnings": conflict_warnings,
    })


@app.route("/api/export")
@login_required
def export_cases():
    advocate_id = g.advocate_id
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT client_name, client_phone, case_number, court_name, case_type, next_hearing_date, notes, status FROM cases WHERE advocate_id=%s ORDER BY next_hearing_date ASC",
        (advocate_id,),
    )
    cases = cur.fetchall()
    cur.close()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Client Name", "Client Phone", "Case Number", "Court Name",
        "Case Type", "Next Hearing Date", "Notes", "Status"
    ])
    for case in cases:
        writer.writerow([
            case["client_name"],
            case["client_phone"] or "",
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
    cur.execute("SELECT * FROM cases WHERE advocate_id=%s ORDER BY created_at DESC", (advocate_id,))
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


# Rename old SQLite database file vakeel.db to advo_buddy.db if it exists
old_db_path = os.path.join(os.path.dirname(__file__), "vakeel.db")
new_db_path = os.path.join(os.path.dirname(__file__), "advo_buddy.db")
if os.path.exists(old_db_path) and not os.path.exists(new_db_path):
    try:
        os.rename(old_db_path, new_db_path)
        print(f"Successfully migrated database from {old_db_path} to {new_db_path}")
    except Exception as e:
        print(f"Error migrating database: {e}")

init_db()
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
