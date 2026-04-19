# Looper Management System

A comprehensive management system for tracking loopers, their data package purchases, and payments.

## 🚀 Features

- **Looper Management**: Register and manage loopers with profile details and CNIC documents.
- **Package Management**: Define data packages with custom pricing.
- **Purchase Tracking**: Monitor package purchases made by loopers.
- **Payment Processing**: Log payments with receipt uploads for verification.
- **Dashboard**: Real-time overview of total loopers, active packages, and financial summaries.

## 🛠️ Tech Stack

- **Frontend**: React.js with Vite, Tailwind CSS (implied by modern look), Lucide React for icons.
- **Backend**: FastAPI (Python), SQLAlchemy ORM.
- **Database**: SQLite (local) / PostgreSQL (production ready).
- **Containerization**: Docker & Docker Compose.

## 🏃 Getting Started

### Prerequisites

- Docker and Docker Compose installed on your machine.

### Quick Start (Docker)

To run the entire application using Docker:

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd internet
    ```

2.  **Start the services**:
    ```bash
    docker compose up -d --build
    ```

3.  **Access the application**:
    - Frontend: [http://localhost](http://localhost)
    - Backend API Docs: [http://localhost:8005/docs](http://localhost:8005/docs)

### Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

## ⚙️ Configuration

Environment variables can be configured in the `docker-compose.yml` or a `.env` file:

- `DATABASE_URL`: SQLAlchemy database connection string.
- `SECRET_KEY`: Security key for JWT authentication.
- `ADMIN_USERNAME`: Default admin username.
- `ADMIN_PASSWORD`: Default admin password.

## 📁 Project Structure

```text
.
├── backend/            # FastAPI Backend
│   ├── app/           # Application logic (models, routes, core)
│   ├── main.py        # Entry point
│   └── Dockerfile     # Backend Docker configuration
├── frontend/           # React Frontend
│   ├── src/           # Components, pages, assets
│   └── Dockerfile     # Frontend Docker configuration
├── docker-compose.yml  # Orchestration
└── README.md           # This file
```

## 📜 License

This project is licensed under the MIT License.
