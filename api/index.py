import sys
import os

# Ensure the backend directory is in the path for Vercel
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root_dir, "backend"))

from backend.main import app

# This shim is required for Vercel to pick up the FastAPI app
# and serve it as a serverless function.
