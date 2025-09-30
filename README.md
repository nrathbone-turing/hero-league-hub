# Hero League Hub

Participant-facing app for managing hero event registrations, matches, and analytics.
Built with **Flask (backend)**, **React + Vite (frontend)**, and **Postgres** for persistence.

## Getting Started

You can run Hero League Hub in two ways: **locally (no Docker required)** or **with Docker Compose**.

---

### Option 1: Local Development (Recommended for quick iteration)

Run frontend and backend in separate terminals.

#### Backend
```bash
cd backend
pip install -r requirements.txt
python wsgi.py
```
Notes:
- Runs on: http://localhost:5500
- Health check: http://localhost:5500/api/health

#### Frontend
```bash
cd frontend
npm install   # only first time
npm run dev
```
Notes:
- Runs on: http://localhost:3000
- The frontend is configured to proxy API requests (e.g. /api/health) to the backend automatically

### Option 2: Docker Compose (Full stack with DB)
Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

This will start:
- **Backend** at http://localhost:5500
- **Frontend** at http://localhost:3000
- **Postgres DB** at `localhost:5432` with persistent volume (`postgres_data`)

To stop everything:
```bash
docker compose down
```

---

## Database Management

Notes:
- Database schema and seed data are managed with **Flask-Migrate** and helper scripts.
- All commands are available via **npm scripts** (they run inside the backend container).

### Initialize migrations (only once per project)
```bash
npm run db:init
```

### Generate new migration
```bash
npm run db:migrate
```

### Apply latest migrations
```bash
npm run db:upgrade
```

### Seed with initial data
```bash
npm run db:seed
```

### Clear all data
```bash
npm run db:clear
```

### Full reset (clear → migrate → seed)
```bash
npm run db:reset
```

---

## Quick Test Checklist
### Visit the frontend: http://localhost:3000
This should display the **Hero League Hub UI**

### Visit the backend health endpoint: http://localhost:5500/api/health
This should return:
```json
{"service":"Hero League Hub","status":"ok"}
```
### Visit proxied route: http://localhost:3000/api/health
This should also return the same JSON as above

### Verify database contents:
#### Users
Command:
```bash
docker exec -it hero-league-hub-db-1 psql -U postgres -d heroleague -c "SELECT * FROM users LIMIT 5;"
```

Expected output:
```python
id | username |        email        
---+----------+----------------------
 1 | admin    | admin@example.com
(1 row)
```

#### Events
Command:
```bash
docker exec -it hero-league-hub-db-1 psql -U postgres -d heroleague -c "SELECT * FROM events LIMIT 5;"
```

Expected output:
```python
 id |  name   |    date    | rules |  status   
----+---------+------------+-------+-----------
  1 | Event 1 | 2025-09-10 |       | drafting
  2 | Event 2 | 2025-09-11 |       | published
  3 | Event 3 | 2025-09-12 |       | cancelled
  4 | Event 4 | 2025-09-13 |       | drafting
  5 | Event 5 | 2025-09-14 |       | completed
(5 rows)
```

#### Entrants
Command:
```bash
docker exec -it hero-league-hub-db-1 psql -U postgres -d heroleague -c "SELECT * FROM entrants LIMIT 5;"
```

Expected output:
```python
 id |  name  | alias  | event_id | dropped 
----+--------+--------+----------+---------
  1 | Hero 1 | Alias1 |        1 | f
  2 | Hero 2 | Alias2 |        1 | f
  3 | Hero 3 | Alias3 |        1 | f
  4 | Hero 4 | Alias4 |        1 | f
  5 | Hero 5 | Alias5 |        1 | f
(5 rows)
```

#### Matches
Command:
```bash
docker exec -it hero-league-hub-db-1 psql -U postgres -d heroleague -c "SELECT * FROM matches LIMIT 5;"
```

Expected output:
```python
 id | event_id | round | entrant1_id | entrant2_id | scores | winner_id 
----+----------+-------+-------------+-------------+--------+-----------
  1 |        1 |     1 |           1 |           2 | 2-0    |         1
  2 |        1 |     1 |           3 |           4 | 0-2    |         4
  3 |        1 |     1 |           5 |           6 | 2-1    |         5
  4 |        1 |     1 |           7 |           8 | 1-2    |         8
  5 |        2 |     1 |           9 |          10 | 2-0    |         9
(5 rows)
```



---

## Tech Stack
- **Backend:** Flask, Flask-Migrate, Flask-SQLAlchemy, Flask-JWT-Extended
- **Frontend:** React, Vite
- **Database:** Postgres 15 (via Docker)
- **Dev Tools:** Docker Compose, Black, Flake8, Pytest

---

## Project Structure
```
placeholder for tree
```

---

## Known Issues
- placeholder

## Future Improvements
- placeholder

---

## About This Repo
**Author:** Nick Rathbone | [GitHub Profile](https://github.com/nrathbone-turing)

This project is part of the Flatiron School Capstone course.

**License:** MIT — feel free to use or remix!