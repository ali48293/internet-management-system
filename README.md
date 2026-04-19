# AD Internet Management System

A full-stack management system for internet packages, payments, and client reports.

## Tech Stack
- **Frontend**: React (Vite)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (Neon.tech)
- **Image Storage**: Cloudinary
- **Hosting**: Vercel (Monorepo)

## Deployment Instructions (Vercel)

When importing this repository into Vercel as a new project, use the following settings to ensure both the frontend and backend are deployed in one project:

### 1. Build & Output Settings
- **Framework Preset**: `Other`
- **Root Directory**: `.`
- **Build Command**: `npm install --prefix frontend && npm run build --prefix frontend`
- **Output Directory**: `frontend/dist`
- **Install Command**: `npm install --prefix frontend`

### 2. Required Environment Variables
Add these in the Vercel Dashboard settings:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.
- `VITE_API_URL`: `/api`
- `ENVIRONMENT`: `production`

## Local Development

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. `uvicorn main:app --reload --port 8085`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
