# Advo Buddy - Deployment Instructions for Developer

Hi! "Advo Buddy" is a case & hearing tracker for advocates, with multi-user
login and WhatsApp/SMS reminders via Twilio. It's now two separately deployed
pieces:

- **`app.py`** - a Flask JSON API (no server-rendered HTML anymore). Stateless
  bearer-token auth, CORS enabled via Flask-Cors.
- **`frontend/`** - a Vite + React single-page app that talks to the API.

## What's in this zip

- `app.py` - the Flask JSON API
- `frontend/` - the React (Vite) SPA; build with `npm run build` (in
  `frontend/`) to produce static assets in `frontend/dist/`
- `send_reminders.py` - script that sends WhatsApp/SMS reminders (via Twilio)
- `run_reminders.bat` - Windows batch wrapper for scheduling
- `config.py` - placeholder for Twilio credentials (currently empty/dummy
  values - the account owner has their own filled-in version locally,
  which was NOT included here for security; ask them for it, or set up a
  fresh Twilio account)
- `requirements.txt` - Python dependencies
- `.gitignore` - excludes config.py and the local SQLite DB from git

## What's needed

Please deploy this so it's accessible on the internet 24/7 (not dependent
on anyone's personal laptop being on). Suggested approach:

1. **API host**: Render.com, Railway.app, PythonAnywhere, or similar
   (Render.com free tier works well for Flask apps)
2. **Frontend host**: any static host works (Render/Netlify/Vercel/Cloudflare
   Pages) serving `frontend/dist/` after running `npm run build`. Point it at
   the deployed API's URL (see below) - it does not need to be the same origin
   as the API as long as CORS stays enabled.
3. **Database**: Postgres via Supabase - `DATABASE_URL` must be set as an
   environment variable on the API host (see `.env` locally for the
   expected format). Tables are created/migrated automatically on startup.
4. **Environment variables to set** on the API host (instead of using
   config.py, since we removed real secrets from this zip):
   - `DATABASE_URL` - required - the Supabase Postgres connection string (use PgBouncer port 6543)
   - `SECRET_KEY` - required - any random 64-char string for application secret signing
   - `CORS_ORIGINS` - required in production - comma-separated list of allowed frontend origins (e.g. `https://advobuddy.com,https://app.advobuddy.com`)
   - `SUPABASE_URL` & `SUPABASE_ANON_KEY` - required for Supabase Auth integration
   - `SUPABASE_JWT_SECRET` - (recommended for ultra-low latency) enables sub-millisecond local JWT verification without outbound HTTP round-trips
   - `REDIS_URL` - (recommended for high traffic) enables distributed rate limiting & shared eCourts CAPTCHA sessions across multiple Gunicorn workers / containers
   - `DB_POOL_MIN` & `DB_POOL_MAX` - database connection pool sizes (default 2 and 20)
   - `AI_API_KEY` or `GEMINI_API_KEY` - for AI Case Analysis and Legal Assistant features
   - `GROQ_API_KEY` - (optional) backup AI provider
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` - (optional) for WhatsApp hearing reminders


   (`send_reminders.py` already reads these from environment variables
   first, falling back to `config.py` only for local dev — see the code.)

   On the frontend build, if the API isn't same-origin in production, set
   the frontend's API base URL accordingly (currently the frontend calls
   relative `/api/...` paths, assuming it's served from the same origin as
   the API, or proxied there - adjust `frontend/src/api/client.js` if you
   deploy them on separate domains).
5. **Run command (API)**: `gunicorn app:app` (gunicorn is in requirements.txt)
6. **Reminders**: `send_reminders.py` needs to run once a day (a cron job
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
