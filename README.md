# Vakeel Assist — Case & Hearing Tracker for Advocates

A simple Python (Flask) web app to help advocates track cases and hearing dates,
so nothing is missed and less time is spent on manual diary management.

## Recent Updates (July 19, 2026)

The project has been upgraded with the following system features and UI/UX animation updates:
- **Centralized Premium Styles**: Moved inline styles into a clean, central [style.css](file:///d:/My%20Work/vakeel-assist/static/css/style.css) stylesheet using variables.
- **Theme Switcher (Dark/Light)**: Added a navbar theme toggle button persisted via `localStorage` with smooth color transitions.
- **Instant Search & Filter**: Integrated a real-time search input bar on the dashboard that dynamically filters cards and sections.
- **CSV Export**: Created a backend download route `/export` in [app.py](file:///d:/My%20Work/vakeel-assist/app.py) to export active case lists to CSV.
- **Micro-Animations & UI**: Implemented staggered slide-ins, glassmorphism containers, input focus underlines, button hover shimmers, and animated mesh gradient backgrounds.

## Features (MVP v2 - Multi-User)
- **Multiple advocates can sign up** and each one only sees their own cases (private, secure)
- Signup / Login / Logout with password hashing (no plain-text passwords stored)
- Add / edit / delete cases with client details, court name, hearing date
- Dashboard auto-sorts cases into: **Overdue, Today, This Week, Upcoming**
- Stats overview at a glance
- Local SQLite database (no external setup needed) - fine for hundreds/thousands of advocates before you need to upgrade to PostgreSQL

## How to Run

1. Install Flask (only dependency needed):
   ```
   pip install flask
   ```

2. Run the app:
   ```
   python app.py
   ```

3. Open in browser:
   ```
   http://localhost:5000
   ```

The database file `vakeel.db` will be created automatically on first run.

## WhatsApp / SMS Reminders (New!)

Advocates can now get a reminder on their own phone before each hearing.

### Setup Steps

1. Sign up for a free Twilio account: https://www.twilio.com/try-twilio
2. On the Twilio Console dashboard (https://console.twilio.com), copy your
   **Account SID** and **Auth Token**.
3. Open `config.py` and paste them in.
4. For **SMS**: Twilio gives you a free phone number - copy it into
   `TWILIO_SMS_FROM` in `config.py` (format: `+1XXXXXXXXXX`).
5. For **WhatsApp**: Twilio provides a free sandbox number
   (`whatsapp:+14155238886`, already filled in). Each advocate who wants
   WhatsApp reminders must send the join code Twilio gives you to that
   number once, from their own WhatsApp, before they can receive messages.
   (See https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
6. Install the Twilio Python library:
   ```
   pip install twilio
   ```
7. In the app, each advocate goes to **⚙ Reminders** (top menu) and sets
   their phone number, WhatsApp or SMS, and how many days before a hearing
   they want to be reminded.
8. Run the reminder script once a day:
   ```
   python send_reminders.py
   ```

### Automating it daily (Windows)

Use **Task Scheduler** (search for it in the Start menu):
1. Create a new Basic Task, name it "Vakeel Assist Reminders"
2. Trigger: Daily, pick a time (e.g. 8:00 AM)
3. Action: Start a program
   - Program: `python`
   - Arguments: `send_reminders.py`
   - Start in: the full path to your `vakeel_assist` folder
4. Finish - it will now run automatically every day.

**Note:** Twilio's free trial account can only send messages to phone
numbers you've verified in the Twilio console. To send to any number
without restriction, you'll need to upgrade to a paid Twilio account
(pay-as-you-go, a few paise per SMS/WhatsApp message).

## Next Steps (Roadmap for v3)

- [ ] Client-facing reminders (currently reminders go to the advocate only)
- [ ] Document drafting templates (legal notice, affidavit, petition) in Tamil + English
- [ ] Case history / judgment notes per case
- [ ] Simple billing & fee tracker
- [ ] Export case list to PDF/Excel

## Deployment Options (When Ready to Launch)
- **Free/cheap hosting:** Render.com, PythonAnywhere, Railway.app
- **Domain:** Get a `.in` domain for Tamil Nadu branding (e.g. vakeelassist.in)
- **Database upgrade:** Move from SQLite to PostgreSQL when you have real users

## Tech Stack
- Backend: Python + Flask
- Database: SQLite (built into Python, zero setup)
- Frontend: HTML/CSS (Jinja2 templates, no JS framework needed for v1)
