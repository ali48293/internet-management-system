from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings
import os

engine_url = settings.DATABASE_URL
if engine_url.startswith("postgres://"):
    engine_url = engine_url.replace("postgres://", "postgresql+pg8000://", 1)
elif engine_url.startswith("postgresql://"):
    engine_url = engine_url.replace("postgresql://", "postgresql+pg8000://", 1)

engine_kwargs = {}
if engine_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Essential for Neon/Vercel: ensure SSL is handled
    engine_kwargs["connect_args"] = {"sslmode": "require"}

engine = create_engine(engine_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
