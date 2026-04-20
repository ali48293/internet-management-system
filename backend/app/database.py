from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.core.config import settings
import os
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

engine_url = settings.DATABASE_URL

# Robust URL handling for serverless (Neon/Vercel)
parsed_url = urlparse(engine_url)
if parsed_url.scheme in ["postgres", "postgresql"]:
    # 1. Ensure driver is pg8000
    new_scheme = "postgresql+pg8000"
    
    # 2. Strip incompatible query parameters
    query_params = parse_qs(parsed_url.query)
    query_params.pop("sslmode", None)
    query_params.pop("sslrootcert", None)
    new_query = urlencode(query_params, doseq=True)
    
    # 3. Reconstruct URL
    parsed_url = parsed_url._replace(scheme=new_scheme, query=new_query)
    engine_url = urlunparse(parsed_url)

engine_kwargs = {}
if engine_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Essential for Neon/Vercel: ensure SSL is handled
    # pg8000 uses 'ssl_context' instead of 'ssl' in modern versions
    engine_kwargs["connect_args"] = {"ssl_context": True}

engine = create_engine(engine_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
