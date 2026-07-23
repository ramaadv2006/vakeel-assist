"""
Vakeel Assist - Case & Hearing Tracker for Advocates (Multi-User Version)
Many advocates can sign up and use this app - each advocate only sees
their own cases. Built to save advocates time on manual diary management.
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from datetime import datetime
from functools import wraps
import os
import sqlite3

try:
    import psycopg2
    import psycopg2.extras
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "vakeel-assist-secret-key-change-this-in-production")

DATABASE_URL = os.environ.get("DATABASE_URL")
STALE_CASE_DAYS = 60

UPLOAD_FOLDER = os.path.join(app.root_path, "static", "uploads", "avatars")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def get_serializer():
    return URLSafeTimedSerializer(app.secret_key)


def generate_reset_token(email):
    serializer = get_serializer()
    return serializer.dumps(email, salt="password-reset-salt")


def verify_reset_token(token, max_age=3600):
    serializer = get_serializer()
    try:
        email = serializer.loads(token, salt="password-reset-salt", max_age=max_age)
        return email
    except (SignatureExpired, BadTimeSignature):
        return None


# Wrapper classes to make SQLite act like psycopg2 with RealDictCursor and %s placeholders
class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, query, params=None):
        # Convert %s placeholders to ?
        query = query.replace('%s', '?')
        # Map Postgres SERIAL PRIMARY KEY to SQLite INTEGER PRIMARY KEY AUTOINCREMENT
        if "SERIAL PRIMARY KEY" in query:
            query = query.replace("SERIAL PRIMARY KEY", "INTEGER PRIMARY KEY AUTOINCREMENT")
        
        if params is not None:
            # Ensure params is a tuple/list (e.g. if single element parameter, make tuple)
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
        # Fallback to local SQLite database
        db_path = os.path.join(os.path.dirname(__file__), "vakeel.db")
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

    # Dynamic schema migration for existing cases table
    if DATABASE_URL and HAS_POSTGRES:
        # Postgres column checks
        def col_exists(col):
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='cases' AND column_name=%s
            """, (col,))
            return cur.fetchone() is not None
    else:
        # SQLite column checks
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

    # Dynamic schema migration for existing advocates table
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


# ---------- Auth helpers ----------

def login_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "advocate_id" not in session:
            flash("Please log in to continue.", "error")
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return wrapper


@app.context_processor
def inject_advocate():
    return {
        "current_advocate_name": session.get("advocate_name"),
        "current_advocate_avatar": session.get("advocate_avatar")
    }


# ---------- Auth routes ----------

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        name = request.form["name"].strip()
        email = request.form["email"].strip().lower()
        phone = request.form.get("phone", "").strip()
        bar_number = request.form.get("bar_council_number", "").strip()
        password = request.form["password"]

        if not name or not email or not password:
            flash("Please fill all required fields.", "error")
            return redirect(url_for("signup"))

        if len(password) < 6:
            flash("Password should be at least 6 characters.", "error")
            return redirect(url_for("signup"))

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id FROM advocates WHERE email=%s", (email,))
        existing = cur.fetchone()
        if existing:
            cur.close()
            conn.close()
            flash("An account with this email already exists. Please log in.", "error")
            return redirect(url_for("login"))

        password_hash = generate_password_hash(password)
        cur.execute(
            """INSERT INTO advocates (name, email, phone, bar_council_number, password_hash)
               VALUES (%s, %s, %s, %s, %s) RETURNING id""",
            (name, email, phone, bar_number, password_hash),
        )
        advocate_id = cur.fetchone()["id"]
        conn.commit()
        cur.close()
        conn.close()

        session["advocate_id"] = advocate_id
        session["advocate_name"] = name
        session["advocate_avatar"] = None
        flash(f"Welcome to Vakeel Assist, {name}!", "success")
        return redirect(url_for("dashboard"))

    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"].strip().lower()
        password = request.form["password"]

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM advocates WHERE email=%s", (email,))
        advocate = cur.fetchone()
        cur.close()
        conn.close()

        if advocate is None or not check_password_hash(advocate["password_hash"], password):
            flash("Invalid email or password.", "error")
            return redirect(url_for("login"))

        session["advocate_id"] = advocate["id"]
        session["advocate_name"] = advocate["name"]
        session["advocate_avatar"] = advocate.get("profile_image")
        flash(f"Welcome back, {advocate['name']}!", "success")
        return redirect(url_for("dashboard"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully.", "success")
    return redirect(url_for("login"))


@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        if not email:
            flash("Please enter your registered email address.", "error")
            return redirect(url_for("forgot_password"))

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM advocates WHERE email=%s", (email,))
        advocate = cur.fetchone()
        cur.close()
        conn.close()

        if advocate:
            token = generate_reset_token(email)
            reset_url = url_for("reset_password", token=token, _external=True)
            flash(
                f"Password reset link generated for {email}! Reset link: {reset_url}",
                "success",
            )
        else:
            flash("If an account with that email exists, a password reset link has been generated.", "success")

        return redirect(url_for("login"))

    return render_template("forgot_password.html")


@app.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token):
    email = verify_reset_token(token)
    if not email:
        flash("The password reset link is invalid or has expired. Please request a new one.", "error")
        return redirect(url_for("forgot_password"))

    if request.method == "POST":
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not password or len(password) < 6:
            flash("Password must be at least 6 characters.", "error")
            return redirect(url_for("reset_password", token=token))

        if password != confirm_password:
            flash("Passwords do not match.", "error")
            return redirect(url_for("reset_password", token=token))

        password_hash = generate_password_hash(password)
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE advocates SET password_hash=%s WHERE email=%s", (password_hash, email))
        conn.commit()
        cur.close()
        conn.close()

        flash("Your password has been reset successfully! You can now log in.", "success")
        return redirect(url_for("login"))

    return render_template("reset_password.html", token=token, email=email)


@app.route("/settings", methods=["GET", "POST"])
@login_required
def settings():
    advocate_id = session["advocate_id"]
    conn = get_db()
    cur = conn.cursor()

    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        phone = request.form.get("phone", "").strip()
        bar_number = request.form.get("bar_council_number", "").strip()
        office_address = request.form.get("office_address", "").strip()
        specialization = request.form.get("specialization", "").strip()
        reminder_method = request.form.get("reminder_method", "none")
        reminder_days_before = request.form.get("reminder_days_before", "1")

        if not name or not email:
            flash("Name and email are required.", "error")
            return redirect(url_for("settings"))

        # Check if email changed and is taken by another advocate
        cur.execute("SELECT id FROM advocates WHERE email=%s AND id!=%s", (email, advocate_id))
        if cur.fetchone():
            cur.close()
            conn.close()
            flash("Another account is already using this email address.", "error")
            return redirect(url_for("settings"))

        # Fetch current record for image replacement
        cur.execute("SELECT profile_image FROM advocates WHERE id=%s", (advocate_id,))
        adv_rec = cur.fetchone()
        current_image = adv_rec.get("profile_image") if adv_rec else None

        profile_image = current_image
        if "profile_image" in request.files:
            file = request.files["profile_image"]
            if file and file.filename != "":
                ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
                if ext in ALLOWED_EXTENSIONS:
                    filename = f"avatar_{advocate_id}_{int(datetime.now().timestamp())}.{ext}"
                    filepath = os.path.join(UPLOAD_FOLDER, filename)
                    file.save(filepath)
                    profile_image = filename

                    # Clean up old image if present
                    if current_image and current_image != filename:
                        old_path = os.path.join(UPLOAD_FOLDER, current_image)
                        if os.path.exists(old_path):
                            try:
                                os.remove(old_path)
                            except Exception:
                                pass
                else:
                    flash("Invalid image format. Allowed: PNG, JPG, JPEG, WEBP, GIF.", "error")
                    return redirect(url_for("settings"))

        cur.execute(
            """UPDATE advocates SET name=%s, email=%s, phone=%s, bar_council_number=%s,
               office_address=%s, specialization=%s, profile_image=%s,
               reminder_method=%s, reminder_days_before=%s WHERE id=%s""",
            (name, email, phone, bar_number, office_address, specialization, profile_image,
             reminder_method, reminder_days_before, advocate_id),
        )
        conn.commit()
        cur.close()
        conn.close()

        session["advocate_name"] = name
        session["advocate_avatar"] = profile_image

        flash("Profile and settings updated successfully!", "success")
        return redirect(url_for("settings"))

    cur.execute("SELECT * FROM advocates WHERE id=%s", (advocate_id,))
    advocate = cur.fetchone()
    cur.close()
    conn.close()
    return render_template("settings.html", advocate=advocate)


@app.route("/settings/avatar/delete", methods=["POST"])
@login_required
def delete_avatar():
    advocate_id = session["advocate_id"]
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT profile_image FROM advocates WHERE id=%s", (advocate_id,))
    advocate = cur.fetchone()
    if advocate and advocate.get("profile_image"):
        old_image = advocate["profile_image"]
        old_path = os.path.join(UPLOAD_FOLDER, old_image)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass
        
        cur.execute("UPDATE advocates SET profile_image=NULL WHERE id=%s", (advocate_id,))
        conn.commit()
        session["advocate_avatar"] = None

    cur.close()
    conn.close()
    flash("Profile picture removed.", "success")
    return redirect(url_for("settings"))


# ---------- Case routes (all scoped to logged-in advocate) ----------

@app.route("/")
@login_required
def dashboard():
    advocate_id = session["advocate_id"]
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

        # Calculate days since last update (most recent hearing_history or created_at)
        last_updated_raw = str(case.get("last_updated_at") or case.get("created_at") or today.strftime("%Y-%m-%d"))[:10]
        try:
            last_update_date = datetime.strptime(last_updated_raw, "%Y-%m-%d").date()
        except ValueError:
            last_update_date = today

        days_since_update = (today - last_update_date).days
        is_stale = (days_since_update >= STALE_CASE_DAYS)
        case["days_since_update"] = days_since_update
        case["is_stale"] = is_stale
        if is_stale:
            stale_cases_count += 1

        if days_left < 0:
            overdue.append((case, days_left))
        elif days_left == 0:
            today_list.append((case, days_left))
        elif days_left <= 7:
            this_week.append((case, days_left))
        else:
            upcoming.append((case, days_left))

    return render_template(
        "dashboard.html",
        overdue=overdue,
        today_list=today_list,
        this_week=this_week,
        upcoming=upcoming,
        total_cases=len(all_cases),
        stale_cases_count=stale_cases_count,
        STALE_CASE_DAYS=STALE_CASE_DAYS,
    )


@app.route("/clients")
@login_required
def client_directory():
    advocate_id = session["advocate_id"]
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM cases WHERE advocate_id=%s ORDER BY client_name ASC",
        (advocate_id,),
    )
    all_cases = cur.fetchall()
    cur.close()
    conn.close()

    # Group cases by client (name + phone) so each client shows once
    # with all of their cases listed underneath, plus a case_count for
    # the clients.html template.
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

    return render_template("clients.html", clients=client_list)


@app.route("/add", methods=["GET", "POST"])
@login_required
def add_case():
    if request.method == "POST":
        advocate_id = session["advocate_id"]
        client_name = request.form["client_name"].strip()
        client_phone = request.form.get("client_phone", "").strip()
        case_number = request.form["case_number"].strip()
        court_name = request.form["court_name"].strip()
        case_type = request.form.get("case_type", "").strip()
        next_hearing_date = request.form["next_hearing_date"]
        notes = request.form.get("notes", "").strip()
        notify_client = 1 if request.form.get("notify_client") == "on" else 0
        opposing_counsel = request.form.get("opposing_counsel", "").strip()
        opposing_counsel_phone = request.form.get("opposing_counsel_phone", "").strip()
        judge_name = request.form.get("judge_name", "").strip()
        court_hall = request.form.get("court_hall", "").strip()
        item_number = request.form.get("item_number", "").strip()
        case_stage = request.form.get("case_stage", "").strip()

        try:
            total_fee = int(request.form.get("total_fee") or 0)
        except ValueError:
            total_fee = 0
        try:
            fee_paid = int(request.form.get("fee_paid") or 0)
        except ValueError:
            fee_paid = 0
        try:
            expenses = int(request.form.get("expenses") or 0)
        except ValueError:
            expenses = 0

        if not client_name or not case_number or not court_name or not next_hearing_date:
            flash("Please fill all required fields.", "error")
            return redirect(url_for("add_case"))

        conn = get_db()
        cur = conn.cursor()

        # Check for hearing date double-booking conflict
        conflicts = check_hearing_conflict(conn, advocate_id, court_name, next_hearing_date)
        if conflicts:
            c_str = ", ".join(conflicts)
            flash(f"Warning: Hearing date conflict detected! You already have active case(s) ({c_str}) at '{court_name}' on {next_hearing_date}.", "warning")

        cur.execute(
            """INSERT INTO cases
               (advocate_id, client_name, client_phone, case_number, court_name, case_type, next_hearing_date, notes, notify_client,
                opposing_counsel, opposing_counsel_phone, judge_name, court_hall, item_number, case_stage, total_fee, fee_paid, expenses)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (advocate_id, client_name, client_phone, case_number, court_name, case_type, next_hearing_date, notes, notify_client,
             opposing_counsel, opposing_counsel_phone, judge_name, court_hall, item_number, case_stage, total_fee, fee_paid, expenses),
        )
        new_case_id = cur.fetchone()["id"]
        add_history_entry(conn, new_case_id, next_hearing_date, note="Case created")
        conn.commit()
        cur.close()
        conn.close()

        flash(f"Case '{case_number}' added successfully!", "success")
        return redirect(url_for("dashboard"))

    return render_template("add_case.html")


@app.route("/edit/<int:case_id>", methods=["GET", "POST"])
@login_required
def edit_case(case_id):
    advocate_id = session["advocate_id"]
    conn = get_db()
    cur = conn.cursor()

    # Make sure this case belongs to the logged-in advocate
    cur.execute(
        "SELECT * FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id)
    )
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        flash("Case not found.", "error")
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        client_name = request.form["client_name"].strip()
        client_phone = request.form.get("client_phone", "").strip()
        case_number = request.form["case_number"].strip()
        court_name = request.form["court_name"].strip()
        case_type = request.form.get("case_type", "").strip()
        next_hearing_date = request.form["next_hearing_date"]
        notes = request.form.get("notes", "").strip()
        status = request.form.get("status", "Active")
        notify_client = 1 if request.form.get("notify_client") == "on" else 0
        opposing_counsel = request.form.get("opposing_counsel", "").strip()
        opposing_counsel_phone = request.form.get("opposing_counsel_phone", "").strip()
        judge_name = request.form.get("judge_name", "").strip()
        court_hall = request.form.get("court_hall", "").strip()
        item_number = request.form.get("item_number", "").strip()
        case_stage = request.form.get("case_stage", "").strip()

        try:
            total_fee = int(request.form.get("total_fee") or 0)
        except ValueError:
            total_fee = 0
        try:
            fee_paid = int(request.form.get("fee_paid") or 0)
        except ValueError:
            fee_paid = 0
        try:
            expenses = int(request.form.get("expenses") or 0)
        except ValueError:
            expenses = 0

        date_changed = next_hearing_date != case["next_hearing_date"]

        # Audit trail field diffing
        fields_to_check = {
            "client_name": client_name,
            "client_phone": client_phone,
            "case_number": case_number,
            "court_name": court_name,
            "case_type": case_type,
            "notes": notes,
            "status": status,
            "notify_client": notify_client,
            "opposing_counsel": opposing_counsel,
            "opposing_counsel_phone": opposing_counsel_phone,
            "judge_name": judge_name,
            "court_hall": court_hall,
            "item_number": item_number,
            "case_stage": case_stage,
            "total_fee": total_fee,
            "fee_paid": fee_paid,
            "expenses": expenses,
        }
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

        # Check for hearing date conflict
        conflicts = check_hearing_conflict(conn, advocate_id, court_name, next_hearing_date, exclude_case_id=case_id)
        if conflicts:
            c_str = ", ".join(conflicts)
            flash(f"Warning: Hearing date conflict detected! You already have active case(s) ({c_str}) at '{court_name}' on {next_hearing_date}.", "warning")

        cur.execute(
            """UPDATE cases SET client_name=%s, client_phone=%s, case_number=%s, court_name=%s,
               case_type=%s, next_hearing_date=%s, notes=%s, status=%s, notify_client=%s,
               opposing_counsel=%s, opposing_counsel_phone=%s, judge_name=%s, court_hall=%s,
               item_number=%s, case_stage=%s, total_fee=%s, fee_paid=%s, expenses=%s
               WHERE id=%s AND advocate_id=%s""",
            (client_name, client_phone, case_number, court_name, case_type,
             next_hearing_date, notes, status, notify_client, opposing_counsel,
             opposing_counsel_phone, judge_name, court_hall, item_number, case_stage,
             total_fee, fee_paid, expenses, case_id, advocate_id),
        )

        # Only add a new history entry when the hearing date actually
        # changed - this is what keeps the 1, 2, 3... history building up
        # under the same case file every time the hearing is updated.
        if date_changed:
            add_history_entry(conn, case_id, next_hearing_date)

        conn.commit()
        cur.close()
        conn.close()
        flash("Case updated successfully!", "success")
        return redirect(url_for("dashboard"))

    cur.close()
    conn.close()
    return render_template("edit_case.html", case=case)


@app.route("/history/<int:case_id>")
@login_required
def case_history(case_id):
    advocate_id = session["advocate_id"]
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id)
    )
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        flash("Case not found.", "error")
        return redirect(url_for("dashboard"))

    cur.execute(
        "SELECT * FROM hearing_history WHERE case_id=%s ORDER BY added_at ASC, id ASC",
        (case_id,),
    )
    history = cur.fetchall()
    cur.close()
    conn.close()

    return render_template("case_history.html", case=case, history=history)


@app.route("/case/<int:case_id>/audit")
@login_required
def case_audit(case_id):
    advocate_id = session["advocate_id"]
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id)
    )
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        flash("Case not found.", "error")
        return redirect(url_for("dashboard"))

    cur.execute(
        "SELECT * FROM case_audit_log WHERE case_id=%s AND advocate_id=%s ORDER BY changed_at DESC, id DESC",
        (case_id, advocate_id),
    )
    audit_logs = cur.fetchall()
    cur.close()
    conn.close()

    return render_template("case_audit.html", case=case, audit_logs=audit_logs)


@app.route("/archive")
@login_required
def case_archive():
    advocate_id = session["advocate_id"]
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

    return render_template(
        "archive.html",
        closed_cases=closed_cases,
        onhold_cases=onhold_cases,
        total_archived=len(archived_cases),
    )


@app.route("/case/<int:case_id>/reopen")
@login_required
def reopen_case(case_id):
    advocate_id = session["advocate_id"]
    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        flash("Case not found.", "error")
        return redirect(url_for("case_archive"))

    if case["status"] == "Active":
        cur.close()
        conn.close()
        flash("Case is already active.", "warning")
        return redirect(url_for("case_archive"))

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
    cur.close()
    conn.close()

    flash(f"Case '{case['case_number']}' reopened and moved back to Active.", "success")
    return redirect(url_for("case_archive"))


@app.route("/tasks")
@login_required
def tasks_hub():
    advocate_id = session["advocate_id"]
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

    return render_template(
        "tasks.html",
        case_groups=case_groups,
        total_open=total_open,
        total_cases=len(case_groups),
    )


@app.route("/diary")
@login_required
def court_diary():
    from datetime import timedelta

    advocate_id = session["advocate_id"]
    date_str = request.args.get("date", "").strip()
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

    return render_template(
        "diary.html",
        advocate=advocate,
        hearings=hearings,
        selected_date=selected_date_str,
        prev_date=prev_date_str,
        next_date=next_date_str,
        is_today=(selected_date_str == datetime.now().date().strftime("%Y-%m-%d")),
    )


@app.route("/cases/bulk-update-dates", methods=["GET", "POST"])
@login_required
def bulk_update_dates():
    if request.method == "POST":
        advocate_id = session["advocate_id"]
        cause_list_text = request.form.get("cause_list_text", "").strip()

        if not cause_list_text:
            flash("Please enter or paste cause list lines to import.", "error")
            return redirect(url_for("bulk_update_dates"))

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

        if updated_count > 0:
            flash(f"Bulk update successful! Updated hearing dates for {updated_count} case(s).", "success")
        if unmatched_list:
            flash(f"The following {len(unmatched_list)} case number(s) did not match any active cases: {', '.join(unmatched_list)}", "warning")
        if invalid_lines:
            flash(f"Skipped {len(invalid_lines)} line(s) due to invalid format: {'; '.join(invalid_lines[:3])}", "error")
        if conflict_warnings:
            for cw in conflict_warnings:
                flash(f"Warning: {cw}", "warning")

        return redirect(url_for("bulk_update_dates"))

    return render_template("bulk_update_dates.html")


@app.route("/delete/<int:case_id>")
@login_required
def delete_case(case_id):
    advocate_id = session["advocate_id"]
    conn = get_db()
    cur = conn.cursor()

    # Make sure this case belongs to the logged-in advocate before deleting
    cur.execute(
        "SELECT id FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id)
    )
    case = cur.fetchone()
    if case is None:
        cur.close()
        conn.close()
        flash("Case not found.", "error")
        return redirect(url_for("dashboard"))

    # Clean up dependent records first
    cur.execute("DELETE FROM hearing_history WHERE case_id=%s", (case_id,))
    cur.execute("DELETE FROM case_audit_log WHERE case_id=%s", (case_id,))
    cur.execute("DELETE FROM case_tasks WHERE case_id=%s", (case_id,))
    cur.execute("DELETE FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    conn.commit()
    cur.close()
    conn.close()
    flash("Case removed.", "success")
    return redirect(url_for("dashboard"))


@app.route("/export")
@login_required
def export_cases():
    import csv
    import io
    from flask import Response

    advocate_id = session["advocate_id"]
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
    response.headers["Content-Disposition"] = "attachment; filename=vakeel_cases_export.csv"
    return response


@app.route("/case/<int:case_id>/tasks")
@login_required
def get_tasks(case_id):
    advocate_id = session["advocate_id"]
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if not case:
        cur.close()
        conn.close()
        return {"error": "Unauthorized"}, 403
    cur.execute("SELECT * FROM case_tasks WHERE case_id=%s ORDER BY id ASC", (case_id,))
    tasks = cur.fetchall()
    cur.close()
    conn.close()
    return {"tasks": tasks}


@app.route("/task/add", methods=["POST"])
@login_required
def add_task():
    advocate_id = session["advocate_id"]
    case_id = request.form.get("case_id")
    title = request.form.get("title", "").strip()
    if not case_id or not title:
        return {"error": "Missing parameter"}, 400
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM cases WHERE id=%s AND advocate_id=%s", (case_id, advocate_id))
    case = cur.fetchone()
    if not case:
        cur.close()
        conn.close()
        return {"error": "Unauthorized"}, 403
    
    cur.execute("INSERT INTO case_tasks (case_id, title) VALUES (%s, %s) RETURNING id", (case_id, title))
    task_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True, "task": {"id": task_id, "title": title, "is_completed": 0}}


@app.route("/task/toggle/<int:task_id>", methods=["POST"])
@login_required
def toggle_task(task_id):
    advocate_id = session["advocate_id"]
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
        return {"error": "Unauthorized"}, 403
    new_state = 1 if not task["is_completed"] else 0
    cur.execute("UPDATE case_tasks SET is_completed=%s WHERE id=%s", (new_state, task_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True, "is_completed": new_state}


@app.route("/task/delete/<int:task_id>", methods=["POST"])
@login_required
def delete_task(task_id):
    advocate_id = session["advocate_id"]
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
        return {"error": "Unauthorized"}, 403
    cur.execute("DELETE FROM case_tasks WHERE id=%s", (task_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True}


@app.route("/billing")
@login_required
def billing():
    advocate_id = session["advocate_id"]
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

    return render_template(
        "billing.html",
        cases=cases,
        total_agreed=total_agreed,
        total_collected=total_collected,
        total_expenses=total_expenses,
        total_pending=total_pending
    )


@app.route("/templates")
@login_required
def templates_page():
    return render_template("templates.html")


init_db()
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
