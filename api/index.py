import sys
import os

# Add the backend directory to the sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from backend.main import app

# This shim is required for Vercel to pick up the FastAPI app
# and serve it as a serverless function.
