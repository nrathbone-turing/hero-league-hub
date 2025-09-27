# Hero League Hub

Participant-facing app for managing hero event registrations, matches, and analytics.

## Getting Started

You can run Hero League Hub in two ways: **locally (no Docker required)** or **with Docker Compose**.

---

### Option 1: Local Development (Recommended to start)
Frontend and backend run in separate terminals:

**Backend**
```bash
cd backend
pip install -r requirements.txt
python wsgi.py
```
Notes:
- Runs on: http://localhost:5500
- Health check: http://localhost:5500/api/health

**Frontend**
```bash
cd frontend
npm install   # only first time
npm run dev
```
Notes:
- Runs on: http://localhost:3000
- The frontend is configured to proxy API requests (e.g. /api/health) to the backend automatically

### Option 2: Docker Compose (Optional, requires Docker Desktop)
If you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed:

```bash
docker compose up --build
```

This will start:
- **Backend** at http://localhost:5500
- **Frontend** at http://localhost:3000
- **Postgres DB** at `localhost:5432`

To stop:
```bash
docker compose down
```

### Quick Test Checklist
- Visit the frontend: http://localhost:3000
  - This should show "Hero League Hub"
- Visit the backend: http://localhost:5500/api/health
  - This should return JSON `{"service":"Hero League Hub","status":"ok"}`
- Visit proxied route: http://localhost:3000/api/health
  - This should also return the same JSON