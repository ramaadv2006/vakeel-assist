"""
Advo Buddy - Daily Reminder Sender

Run this script once a day (e.g. via Windows Task Scheduler, or a cron job
on your host) to send each advocate a WhatsApp or SMS reminder about
hearings coming up, based on their personal settings (see the "Reminders"
section of the Settings page in the app).

Usage:
    python send_reminders.py

Requires:
    pip install twilio
    (and your Twilio credentials filled in inside config.py, or set as
    environment variables - see get_setting() below)

Database: this script reuses app.py's get_db(), which connects to the
Postgres (Supabase) database via DATABASE_URL - it must never open its
own separate connection, or it would silently read/write the wrong data.
"""

import json
import os
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

try:
    from twilio.rest import Client
except ImportError:
    print("Twilio is not installed. Run: pip install twilio")
    raise SystemExit(1)

from app import get_db

# Prefer environment variables (used on cloud hosting like Render) and fall
# back to config.py (used for local testing on your own computer).
try:
    import config
except ImportError:
    config = None


def get_setting(env_name, config_attr, default=None):
    value = os.environ.get(env_name)
    if value:
        return value
    if config is not None:
        return getattr(config, config_attr, default)
    return default


TWILIO_ACCOUNT_SID = get_setting("TWILIO_ACCOUNT_SID", "TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = get_setting("TWILIO_AUTH_TOKEN", "TWILIO_AUTH_TOKEN")
TWILIO_SMS_FROM = get_setting("TWILIO_SMS_FROM", "TWILIO_SMS_FROM")
TWILIO_WHATSAPP_FROM = get_setting("TWILIO_WHATSAPP_FROM", "TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

# WhatsApp requires a pre-approved Content Template for business-initiated
# messages (i.e. anything sent without the recipient having messaged first
# within the last 24h) - which scheduled reminders always are. Without a
# content SID configured, WhatsApp sends fall back to a freeform body, which
# Twilio will reject outside that 24h window.
TWILIO_WHATSAPP_CONTENT_SID = get_setting("TWILIO_WHATSAPP_CONTENT_SID", "TWILIO_WHATSAPP_CONTENT_SID")

# SMTP Configuration
SMTP_SERVER = get_setting("SMTP_SERVER", "SMTP_SERVER")
SMTP_USERNAME = get_setting("SMTP_USERNAME", "SMTP_USERNAME")
SMTP_PASSWORD = get_setting("SMTP_PASSWORD", "SMTP_PASSWORD")
SMTP_FROM_EMAIL = get_setting("SMTP_FROM_EMAIL", "SMTP_FROM_EMAIL")

try:
    SMTP_PORT = int(get_setting("SMTP_PORT", "SMTP_PORT", 587))
except (ValueError, TypeError):
    SMTP_PORT = 587


def send_email(to_email, subject, body):
    if not SMTP_SERVER or not SMTP_USERNAME or not SMTP_PASSWORD:
        print(f"Skipping email to {to_email} - SMTP credentials not configured.")
        return False

    smtp_from = SMTP_FROM_EMAIL or SMTP_USERNAME

    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_from
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(smtp_from, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"SMTP Error sending to {to_email}: {e}")
        return False


def format_phone(phone):
    """Turns a 10-digit Indian number into E.164 format (+91XXXXXXXXXX)."""
    phone = "".join(ch for ch in phone if ch.isdigit())
    if len(phone) == 10:
        return f"+91{phone}"
    if phone.startswith("91") and len(phone) == 12:
        return f"+{phone}"
    return None


def send_message(client, to_phone, method, body, content_variables=None):
    from_number = TWILIO_WHATSAPP_FROM if method == "whatsapp" else TWILIO_SMS_FROM
    to_number = f"whatsapp:{to_phone}" if method == "whatsapp" else to_phone

    if method == "whatsapp" and TWILIO_WHATSAPP_CONTENT_SID and content_variables:
        return client.messages.create(
            content_sid=TWILIO_WHATSAPP_CONTENT_SID,
            content_variables=json.dumps(content_variables),
            from_=from_number,
            to=to_number,
        )
    else:
        return client.messages.create(body=body, from_=from_number, to=to_number)


def main():
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception:
        client = None

    conn = get_db()
    cur = conn.cursor()
    today = datetime.now().date()

    cur.execute(
        "SELECT * FROM advocates WHERE reminder_method IN ('whatsapp', 'sms', 'email')"
    )
    advocates = cur.fetchall()

    total_sent = 0

    for advocate in advocates:
        days_before = advocate["reminder_days_before"] or 1
        target_date = today + timedelta(days=days_before)
        target_date_str = target_date.strftime("%Y-%m-%d")

        cur.execute(
            "SELECT * FROM cases WHERE advocate_id=%s AND status='Active' AND next_hearing_date=%s",
            (advocate["id"], target_date_str),
        )
        cases = cur.fetchall()

        if not cases:
            continue

        method = advocate["reminder_method"]
        phone = None
        if method in ("whatsapp", "sms"):
            phone = format_phone(advocate["phone"])
            if not phone:
                print(f"Skipping {advocate['name']} - invalid phone number on file for Twilio.")
                continue

        for case in cases:
            body = (
                f"Advo Buddy Reminder:\n"
                f"Hearing for {case['client_name']} (Case No: {case['case_number']}) "
                f"at {case['court_name']} is on {case['next_hearing_date']} "
                f"({days_before} day{'s' if days_before > 1 else ''} from now)."
            )
            
            try:
                if method == "email":
                    subject = f"Advo Buddy Reminder: Hearing for {case['client_name']} on {case['next_hearing_date']}"
                    sent = send_email(advocate["email"], subject, body)
                    if sent:
                        print(f"Sent email reminder to {advocate['name']} for case {case['case_number']}")
                        total_sent += 1
                else:
                    if client is None:
                        raise ValueError("Twilio client not initialized.")
                    advocate_content_vars = {
                        "1": str(case["next_hearing_date"]),
                        "2": f"{case['case_number']} at {case['court_name']}",
                        "date": str(case["next_hearing_date"]),
                        "time": f"{case['case_number']} at {case['court_name']}",
                    }
                    send_message(client, phone, method, body, advocate_content_vars)
                    print(f"Sent {method} reminder to {advocate['name']} for case {case['case_number']}")
                    total_sent += 1
            except Exception as e:
                print(f"Failed to send reminder to {advocate['name']}: {e}")

            if case["notify_client"]:
                if method == "email":
                    if case.get("client_email"):
                        client_body = (
                            f"Reminder from {advocate['name']} (Advo Buddy):\n"
                            f"Your hearing (Case No: {case['case_number']}) at {case['court_name']} "
                            f"is on {case['next_hearing_date']}."
                        )
                        subject = f"Hearing Reminder: Case No. {case['case_number']} on {case['next_hearing_date']}"
                        try:
                            sent = send_email(case["client_email"], subject, client_body)
                            if sent:
                                print(f"Sent email reminder to client {case['client_name']} for case {case['case_number']}")
                                total_sent += 1
                        except Exception as e:
                            print(f"Failed to send email to client {case['client_name']}: {e}")
                    else:
                        print(f"Skipping client of case {case['case_number']} - no email address on file.")
                else:
                    if case["client_phone"]:
                        client_phone_fmt = format_phone(case["client_phone"])
                        if not client_phone_fmt:
                            print(f"Skipping client of case {case['case_number']} - invalid phone number on file.")
                            continue

                        client_body = (
                            f"Reminder from {advocate['name']} (Advo Buddy):\n"
                            f"Your hearing (Case No: {case['case_number']}) at {case['court_name']} "
                            f"is on {case['next_hearing_date']}."
                        )
                        client_content_vars = {
                            "1": str(case["next_hearing_date"]),
                            "2": f"{case['case_number']} at {case['court_name']}",
                            "date": str(case["next_hearing_date"]),
                            "time": f"{case['case_number']} at {case['court_name']}",
                        }
                        try:
                            if client is None:
                                raise ValueError("Twilio client not initialized.")
                            send_message(client, client_phone_fmt, method, client_body, client_content_vars)
                            print(f"Sent {method} reminder to client {case['client_name']} for case {case['case_number']}")
                            total_sent += 1
                        except Exception as e:
                            print(f"Failed to send to client {case['client_name']}: {e}")

    cur.close()
    conn.close()
    print(f"\nDone. {total_sent} reminder(s) sent.")


if __name__ == "__main__":
    main()
