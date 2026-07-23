"""
Vakeel Assist - Daily Reminder Sender

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

Database: this script reuses app.py's get_db() so it always talks to
whatever backend the web app itself is using (local SQLite by default,
or Postgres if DATABASE_URL is set) - it must never open its own
separate sqlite3 connection, or it would silently read/write nothing
once the app is migrated to Postgres in production.
"""

import os
from datetime import datetime, timedelta

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


def format_phone(phone):
    """Turns a 10-digit Indian number into E.164 format (+91XXXXXXXXXX)."""
    phone = "".join(ch for ch in phone if ch.isdigit())
    if len(phone) == 10:
        return f"+91{phone}"
    if phone.startswith("91") and len(phone) == 12:
        return f"+{phone}"
    return None


def send_message(client, to_phone, method, body):
    from_number = TWILIO_WHATSAPP_FROM if method == "whatsapp" else TWILIO_SMS_FROM
    to_number = f"whatsapp:{to_phone}" if method == "whatsapp" else to_phone

    client.messages.create(body=body, from_=from_number, to=to_number)


def main():
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    conn = get_db()
    cur = conn.cursor()
    today = datetime.now().date()

    cur.execute(
        "SELECT * FROM advocates WHERE reminder_method IN ('whatsapp', 'sms') AND phone IS NOT NULL AND phone != ''"
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

        phone = format_phone(advocate["phone"])
        if not phone:
            print(f"Skipping {advocate['name']} - invalid phone number on file.")
            continue

        for case in cases:
            body = (
                f"Vakeel Assist Reminder:\n"
                f"Hearing for {case['client_name']} (Case No: {case['case_number']}) "
                f"at {case['court_name']} is on {case['next_hearing_date']} "
                f"({days_before} day{'s' if days_before > 1 else ''} from now)."
            )
            try:
                send_message(client, phone, advocate["reminder_method"], body)
                print(f"Sent {advocate['reminder_method']} reminder to {advocate['name']} for case {case['case_number']}")
                total_sent += 1
            except Exception as e:
                print(f"Failed to send to {advocate['name']}: {e}")

            # Also notify the client if the advocate opted in for this case
            if case["notify_client"] and case["client_phone"]:
                client_phone_fmt = format_phone(case["client_phone"])
                if not client_phone_fmt:
                    print(f"Skipping client of case {case['case_number']} - invalid phone number on file.")
                    continue

                client_body = (
                    f"Reminder from {advocate['name']} (Vakeel Assist):\n"
                    f"Your hearing (Case No: {case['case_number']}) at {case['court_name']} "
                    f"is on {case['next_hearing_date']}."
                )
                try:
                    send_message(client, client_phone_fmt, advocate["reminder_method"], client_body)
                    print(f"Sent {advocate['reminder_method']} reminder to client {case['client_name']} for case {case['case_number']}")
                    total_sent += 1
                except Exception as e:
                    print(f"Failed to send to client {case['client_name']}: {e}")

    cur.close()
    conn.close()
    print(f"\nDone. {total_sent} reminder(s) sent.")


if __name__ == "__main__":
    main()
