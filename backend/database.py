import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ── Database selection ─────────────────────────────────────────────────────────
# If POSTGRES_HOST is set in the environment the app uses PostgreSQL (Docker).
# Otherwise it falls back to a local SQLite file so you can develop without Docker.

POSTGRES_HOST = os.getenv("POSTGRES_HOST", "")

if POSTGRES_HOST:
    POSTGRES_USER     = os.getenv("POSTGRES_USER",     "user")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_DB       = os.getenv("POSTGRES_DB",       "insightshield")
    POSTGRES_PORT     = os.getenv("POSTGRES_PORT",     "5432")

    SQLALCHEMY_DATABASE_URL = (
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
        f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
    print(f"✅ Using PostgreSQL @ {POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")
else:
    # Fallback: local SQLite file — no Docker needed
    SQLALCHEMY_DATABASE_URL = "sqlite:///./safescript.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    print("⚠️  POSTGRES_HOST not set — using local SQLite (safescript.db)")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
