# Advo Buddy - Deployment Instructions for Developer

Hi! This is a Flask (Python) web app called "Advo Buddy" - a case &
hearing tracker for advocates, with multi-user login and WhatsApp/SMS
reminders via Twilio.

## What's in this zip

- `app.py` - main Flask application
- `send_reminders.py` - script that sends WhatsApp/SMS reminders (via Twilio)
- `run_reminders.bat` - Windows batch wrapper for scheduling
- `config.py` - placeholder for Twilio credentials (currently empty/dummy
  values - the account owner has their own filled-in version locally,
  which was NOT included here for security; ask them for it, or set up a
  fresh Twilio account)
- `requirements.txt` - Python dependencies
- `templates/` - HTML templates (Jinja2)
- `.gitignore` - excludes config.py and the local SQLite DB from git

## What's needed

Please deploy this so it's accessible on the internet 24/7 (not dependent
on anyone's personal laptop being on). Suggested approach:

1. **Host**: Render.com, Railway.app, PythonAnywhere, or similar
   (Render.com free tier works well for Flask apps)
2. **Database**: Currently uses SQLite (`advo_buddy.db`, auto-created on first
   run). This is fine for a low-traffic MVP, but note that on most free
   hosts the filesystem resets on redeploy, wiping the DB. If persistence
   matters, consider migrating to the host's free PostgreSQL instead.
3. **Environment variables to set** on the host (instead of using
   config.py, since we removed real secrets from this zip):
   - `SECRET_KEY` - any random string, for Flask session security
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_SMS_FROM`
   - `TWILIO_WHATSAPP_FROM` (defaults to Twilio's sandbox number
     `whatsapp:+14155238886` if not set)

   (`send_reminders.py` already reads these from environment variables
   first, falling back to `config.py` only for local dev — see the code.)

4. **Run command**: `gunicorn app:app` (gunicorn is in requirements.txt)
5. **Reminders**: `send_reminders.py` needs to run once a day (a cron job
   / scheduled job on the host, since `run_reminders.bat` is Windows-only
   and won't work on Linux hosts). Most hosts (Render, Railway) support
   scheduled jobs/cron in their dashboard.

## Twilio notes

- The account is currently on Twilio's **free trial**, which can only
  send SMS/WhatsApp to phone numbers that have been individually
  verified in the Twilio console (Verified Caller IDs), or that have
  joined the WhatsApp sandbox by messaging a join code.
- For this to work for arbitrary advocates/clients without them manually
  verifying, the Twilio account needs to be **upgraded to a paid account**
  (pay-as-you-go, no big upfront cost) and, for WhatsApp, ideally approved
  for the WhatsApp Business API (out of sandbox) - that's a separate
  Twilio approval process.

## Contact

Ping the account owner if anything is unclear or you need the real
Twilio credentials / a fresh Twilio account set up.
