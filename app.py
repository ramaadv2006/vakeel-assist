"""
Vakeel Assist - Case & Hearing Tracker for Advocates (Multi-User Version)
Many advocates can sign up and use this app - each advocate only sees
their own cases. Built to save advocates time on manual diary management.
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from datetime import datetime
from functools import wraps
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "vakeel-assist-secret-key-change-this-in-production")

DB_PATH = os.path.join(os.path.dirname(__file__), "vakeel.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS advocates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    conn.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    conn.commit()
    conn.close()


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
    return {"current_advocate_name": session.get("advocate_name")}


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
        existing = conn.execute("SELECT id FROM advocates WHERE email=?", (email,)).fetchone()
        if existing:
            conn.close()
            flash("An account with this email already exists. Please log in.", "error")
            return redirect(url_for("login"))

        password_hash = generate_password_hash(password)
        cursor = conn.execute(
            """INSERT INTO advocates (name, email, phone, bar_council_number, password_hash)
               VALUES (?, ?, ?, ?, ?)""",
            (name, email, phone, bar_number, password_hash),
        )
        conn.commit()
        advocate_id = cursor.lastrowid
        conn.close()

        session["advocate_id"] = advocate_id
        session["advocate_name"] = name
        flash(f"Welcome to Vakeel Assist, {name}!", "success")
        return redirect(url_for("dashboard"))

    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"].strip().lower()
        password = request.form["password"]

        conn = get_db()
        advocate = conn.execute("SELECT * FROM advocates WHERE email=?", (email,)).fetchone()
        conn.close()

        if advocate is None or not check_password_hash(advocate["password_hash"], password):
            flash("Invalid email or password.", "error")
            return redirect(url_for("login"))

        session["advocate_id"] = advocate["id"]
        session["advocate_name"] = advocate["name"]
        flash(f"Welcome back, {advocate['name']}!", "success")
        return redirect(url_for("dashboard"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully.", "success")
    return redirect(url_for("login"))


@app.route("/settings", methods=["GET", "POST"])
@login_required
def settings():
    advocate_id = session["advocate_id"]
    conn = get_db()

    if request.method == "POST":
        phone = request.form.get("phone", "").strip()
        reminder_method = request.form.get("reminder_method", "none")
        reminder_days_before = request.form.get("reminder_days_before", "1")

        conn.execute(
            "UPDATE advocates SET phone=?, reminder_method=?, reminder_days_before=? WHERE id=?",
            (phone, reminder_method, reminder_days_before, advocate_id),
        )
        conn.commit()
        conn.close()
        flash("Reminder settings saved.", "success")
        return redirect(url_for("settings"))

    advocate = conn.execute("SELECT * FROM advocates WHERE id=?", (advocate_id,)).fetchone()
    conn.close()
    return render_template("settings.html", advocate=advocate)


# ---------- Case routes (all scoped to logged-in advocate) ----------

@app.route("/")
@login_required
def dashboard():
    advocate_id = session["advocate_id"]
    conn = get_db()
    today = datetime.now().date()

    all_cases = conn.execute(
        "SELECT * FROM cases WHERE status='Active' AND advocate_id=? ORDER BY next_hearing_date ASC",
        (advocate_id,),
    ).fetchall()
    conn.close()

    overdue, today_list, this_week, upcoming = [], [], [], []
    for case in all_cases:
        hearing_date = datetime.strptime(case["next_hearing_date"], "%Y-%m-%d").date()
        days_left = (hearing_date - today).days

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
    )


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

        if not client_name or not case_number or not court_name or not next_hearing_date:
            flash("Please fill all required fields.", "error")
            return redirect(url_for("add_case"))

        conn = get_db()
        conn.execute(
            """INSERT INTO cases
               (advocate_id, client_name, client_phone, case_number, court_name, case_type, next_hearing_date, notes, notify_client)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (advocate_id, client_name, client_phone, case_number, court_name, case_type, next_hearing_date, notes, notify_client),
        )
        conn.commit()
        conn.close()

        flash(f"Case '{case_number}' added successfully!", "success")
        return redirect(url_for("dashboard"))

    return render_template("add_case.html")


@app.route("/edit/<int:case_id>", methods=["GET", "POST"])
@login_required
def edit_case(case_id):
    advocate_id = session["advocate_id"]
    conn = get_db()

    # Make sure this case belongs to the logged-in advocate
    case = conn.execute(
        "SELECT * FROM cases WHERE id=? AND advocate_id=?", (case_id, advocate_id)
    ).fetchone()
    if case is None:
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

        conn.execute(
            """UPDATE cases SET client_name=?, client_phone=?, case_number=?, court_name=?,
               case_type=?, next_hearing_date=?, notes=?, status=?, notify_client=? WHERE id=? AND advocate_id=?""",
            (client_name, client_phone, case_number, court_name, case_type,
             next_hearing_date, notes, status, notify_client, case_id, advocate_id),
        )
        conn.commit()
        conn.close()
        flash("Case updated successfully!", "success")
        return redirect(url_for("dashboard"))

    conn.close()
    return render_template("edit_case.html", case=case)


@app.route("/delete/<int:case_id>")
@login_required
def delete_case(case_id):
    advocate_id = session["advocate_id"]
    conn = get_db()
    conn.execute("DELETE FROM cases WHERE id=? AND advocate_id=?", (case_id, advocate_id))
    conn.commit()
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
    cases = conn.execute(
        "SELECT client_name, client_phone, case_number, court_name, case_type, next_hearing_date, notes, status FROM cases WHERE advocate_id=? ORDER BY next_hearing_date ASC",
        (advocate_id,),
    ).fetchall()
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

init_db()
if __name__ == "__main__":
    
    app.run(debug=True, host="0.0.0.0", port=5000)
