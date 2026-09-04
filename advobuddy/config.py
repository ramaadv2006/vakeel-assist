"""Runtime configuration, loaded from environment variables.

``Config.from_env()`` reads the environment (``.env`` is loaded first by
``python-dotenv`` if present) and ``validate()`` fails fast with a clear
message when a production deployment is missing something important.
"""

import os

INSECURE_SECRET_KEY = "advo-buddy-secret-key-change-this-in-production"  # noqa: S105
_DEV_SECRET_KEY = "dev-only-insecure-key"  # noqa: S105

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _as_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _normalize_pg_url(url):
    if not url:
        return url
    # psycopg2 wants postgresql:// ; Supabase / Heroku hand out postgres://
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _split_csv(value):
    return [item.strip() for item in (value or "").split(",") if item.strip()]


class Config:
    def __init__(self, env):
        self.ENV = env.get("FLASK_ENV", "production").strip().lower()
        self.is_production = self.ENV == "production"

        self.DEBUG = _as_bool(env.get("FLASK_DEBUG"), default=False)
        self.SECRET_KEY = env.get("SECRET_KEY") or None
        self.DATABASE_URL = _normalize_pg_url(env.get("DATABASE_URL"))
        self.SUPABASE_URL = env.get("SUPABASE_URL")
        self.SUPABASE_ANON_KEY = env.get("SUPABASE_ANON_KEY")
        self.SUPABASE_JWT_SECRET = env.get("SUPABASE_JWT_SECRET")

        cors_default = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000"
        self.CORS_ORIGINS = _split_csv(env.get("CORS_ORIGINS", cors_default))

        try:
            mb = int(env.get("MAX_CONTENT_LENGTH_MB", "16"))
        except (TypeError, ValueError):
            mb = 16
        self.MAX_CONTENT_LENGTH = max(1, mb) * 1024 * 1024

        self.UPLOAD_FOLDER = env.get("UPLOAD_FOLDER") or os.path.join(
            _PROJECT_ROOT, "static", "uploads", "avatars"
        )
        
        self.REDIS_URL = env.get("REDIS_URL")
        self.RATELIMIT_STORAGE_URI = env.get(
            "RATELIMIT_STORAGE_URI", self.REDIS_URL or "memory://"
        )

        try:
            self.DB_POOL_MIN = max(1, int(env.get("DB_POOL_MIN", "2")))
        except (TypeError, ValueError):
            self.DB_POOL_MIN = 2

        try:
            self.DB_POOL_MAX = max(self.DB_POOL_MIN, int(env.get("DB_POOL_MAX", "20")))
        except (TypeError, ValueError):
            self.DB_POOL_MAX = 20

        try:
            self.AUTH_TOKEN_CACHE_TTL_SECONDS = int(env.get("AUTH_TOKEN_CACHE_TTL_SECONDS", "300"))
        except (TypeError, ValueError):
            self.AUTH_TOKEN_CACHE_TTL_SECONDS = 300

        self.AUTO_MIGRATE = _as_bool(env.get("AUTO_MIGRATE"), default=True)
        self.MIGRATIONS_DIR = env.get("MIGRATIONS_DIR") or os.path.join(
            _PROJECT_ROOT, "migrations"
        )
        self.STALE_CASE_DAYS = int(env.get("STALE_CASE_DAYS", "60"))

    @classmethod
    def from_env(cls, env=None):
        return cls(env if env is not None else os.environ)

    def validate(self):
        problems = []

        if self.is_production:
            if not self.SECRET_KEY or self.SECRET_KEY == INSECURE_SECRET_KEY:
                problems.append(
                    "SECRET_KEY must be set to a strong random value "
                    '(python -c "import secrets; print(secrets.token_urlsafe(48))").'
                )
            if not self.DATABASE_URL:
                problems.append("DATABASE_URL must be set.")
            if "*" in self.CORS_ORIGINS or not self.CORS_ORIGINS:
                problems.append(
                    "CORS_ORIGINS must be an explicit comma-separated allow-list "
                    "of frontend origins (never '*')."
                )

        if problems:
            raise RuntimeError(
                "Invalid configuration for FLASK_ENV=%s:\n  - %s"
                % (self.ENV, "\n  - ".join(problems))
            )

        # Dev convenience: allow running without a SECRET_KEY, but never silently
        # in production (guarded above).
        if not self.SECRET_KEY:
            self.SECRET_KEY = _DEV_SECRET_KEY

        return self

