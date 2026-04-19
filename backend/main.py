from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import auth, loopers, packages, payments, dashboard, users, activity
from app.database import engine, Base
from app.core.config import settings
from init_db import init_db
import os

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
# Create DB Tables and Initialize Admin
init_db()

app = FastAPI(title=settings.PROJECT_NAME)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please contact support."},
    )

# CORS
origins = [
    "http://localhost",
    "http://localhost:5173", # Vite default
    # Add production frontend URL here later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's an internal tool, allow all origins for now. For prod restrict this.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads static path
if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)

app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(loopers.router, prefix="/api/loopers", tags=["Loopers"])
app.include_router(packages.router, prefix="/api/packages", tags=["Packages"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(activity.router, prefix="/api/activity", tags=["Activity"])

@app.get("/")
def read_root():
    return {"message": "Loopers Management System API is running"}
