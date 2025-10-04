# Hero League Hub

Participant-facing app for managing hero event registrations, matches, and analytics.
Built with **Flask (backend)**, **React + Vite (frontend)**, and **Postgres** for persistence.

## New Feature Highlights
- Analytics dashboards show hero usage, win rates, and event participation trends
- Participant-facing event pages let users track standings and match results
- Personalized player dashboard connects hero selection, event progress, and stats

## Screenshots

## Getting Started

You can run Hero League Hub in two ways: **locally (no Docker required)** or **with Docker Compose**.

### Option 1: Local Development (Recommended for quick iteration)

Run frontend and backend in separate terminals

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
- The frontend proxies API requests (e.g. /api/health) to the backend automatically

### Option 2: Docker Compose (Full stack with DB)
Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/)

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

## Event Registration Flow

Users can now register for published events directly from the app
- **Frontend**: Users pick a hero, then select an event from a filtered dropdown
- **Backend**: `/api/entrants/register` creates a new entrant tied to the logged-in user and chosen hero
- **Persistence**: Entrants and heroes are cached in `localStorage` for dashboard display

### Registration Logic
- Only **published events** appear in dropdowns
- Prevents duplicate registration per user/event
- On successful registration, entrant info appears in **User Dashboard**

---

## Database Management

Managed via **Flask-Migrate** and helper scripts. All commands are runnable via **npm scripts** inside the backend container.
```bash
npm run db:init       # Initialize migrations (once)
npm run db:migrate    # Create migration
npm run db:upgrade    # Apply migrations
npm run db:seed       # Seed database
npm run db:clear      # Clear all data
npm run db:reset      # Full reset (clear --> migrate --> seed)
```

---

## Quick Test Checklist
- **Frontend**: visit http://localhost:3000 --> confirm UI loads
- **Backend**: http://localhost:5500/api/health --> confirm returns `{ "service": "Hero League Hub", "status": "ok" }`
- **Proxied route**: http://localhost:3000/api/health --> confirm returns the same JSON as above

### Sample DB Checks
```bash
# Users
docker exec -it hero-league-hub-db-1 psql -U postgres -d heroleague -c "SELECT * FROM users LIMIT 5;"

# Events
docker exec -it hero-league-hub-db-1 psql -U postgres -d heroleague -c "SELECT * FROM events LIMIT 5;"

# Entrants
docker exec -it hero-league-hub-db-1 psql -U postgres -d heroleague -c "SELECT * FROM entrants LIMIT 5;"

# Matches
docker exec -it hero-league-hub-db-1 psql -U postgres -d heroleague -c "SELECT * FROM matches LIMIT 5;"
```

---

## Tech Stack
- **Backend:** Flask, Flask-Migrate, Flask-SQLAlchemy, Flask-JWT-Extended
- **Frontend:** React, Vite, MUI (Material UI)
- **Database:** Postgres 15 (via Docker)
- **Dev Tools:** Docker Compose, Black, Flake8, Pytest

---

## Running Tests

### Backend Tests (pytest)
Run all backend unit and integration tests:
```bash
npm run test:backend
```

### Frontend Tests (Vitest + React Testing Library)
Run component and UI tests:
```bash
npm run test:frontend
```

### Full Suite (Backend + Frontend)
Run both backend and frontend test suites in sequence:
```bash
npm test
```

### Notes
- Backend tests live in `backend/tests/` and use fixtures defined in `conftest.py`
- Frontend tests live in `frontend/src/__tests__/` and use `setupTests.js` + `test-utils.jsx`
- Ensure your `.env` or `TestConfig` uses `sqlite:///:memory:` for isolated backend runs

---

## API Endpoints

### Auth
- `POST /api/signup` — Create a new user account  
- `POST /api/login` — Authenticate and receive JWT  
- `DELETE /api/logout` — Revoke token (adds to blocklist)

### Events
- `GET /api/events` — List all events (sorted by date/status)
- `POST /api/events` — Create a new event *(admin use only)*
- `PUT /api/events/:id` — Update event status *(admin use only)*
- `DELETE /api/events/:id` — Delete an event *(admin use only)*

### Entrants
- `POST /api/entrants/register` — Register a user + hero for an event  
- `DELETE /api/entrants/unregister/:event_id` — Remove entrant from event  
- `GET /api/entrants?event_id=X&user_id=Y` — Filter entrants by user/event  
- `PUT /api/entrants/:id` — Update entrant info *(admin)*  
- `DELETE /api/entrants/:id` — Hard/soft delete entrant *(admin)*  

### Matches
- `GET /api/matches?event_id=X` — List all matches for an event  
- `POST /api/matches` — Create a match *(admin)*  
- `PUT /api/matches/:id` — Update scores or winner *(admin)*  
- `DELETE /api/matches/:id` — Delete a match *(admin)*  

### Analytics *(coming soon)*
- `/api/analytics/usage` — Participation stats  
- `/api/analytics/results` — Match outcome summaries  
- `/api/analytics/heroes` — Hero win rates + usage rates 
---

## Data Models

### User
| Field | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `username` | String | Unique display name for the user |
| `email` | String | Unique email for login |
| `password_hash` | String | Securely hashed password |
| `is_admin` | Boolean | Flags admin accounts (rare for registrants) |

---

### Hero
| Field | Type | Description |
|--------|------|-------------|
| `id` | Integer | External SuperHero API ID |
| `name` | String | Hero’s public name |
| `full_name` | String | Hero’s real or full name |
| `alignment` | String | `"hero"`, `"villain"`, `"antihero"`, or `"unknown"` |
| `powerstats` | JSON | Key-value stats (strength, speed, etc.) |
| `image` | String | Hero portrait URL |

---

### Event
| Field | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `name` | String | Event title |
| `date` | String | Date of event (ISO or string) |
| `rules` | String | Format or rule set (e.g. "Bo3" or "Villains only") |
| `status` | Enum | `"drafting"`, `"published"`, `"cancelled"`, `"completed"` |
| `entrants` | Relationship | List of registered entrants |
| `matches` | Relationship | List of associated matches |

---

### Entrant
| Field | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `user_id` | FK --> `users.id` | Linked participant |
| `hero_id` | FK --> `heroes.id` | Chosen hero |
| `event_id` | FK --> `events.id` | Event registration |
| `name` | String | User's display name at registration |
| `alias` | String | User's selected hero for event |
| `dropped` | Boolean | Indicates withdrawn or inactive entrant |
| `created_at` / `updated_at` | DateTime | Audit timestamps |

---

### Match
| Field | Type | Description |
|--------|------|-------------|
| `id` | Integer | Primary key |
| `event_id` | FK → `events.id` | Event association |
| `round` | Integer | Match round number |
| `entrant1_id` / `entrant2_id` | FK → `entrants.id` | Match participants |
| `scores` | String | Score summary (e.g., `"2-1"`) |
| `winner_id` | FK → `entrants.id` | Match winner |

---

**Relationships**
- One **Event** → many **Entrants** and **Matches**  
- One **User** → many **Entrants**  
- One **Hero** → many **Entrants** (reused across events)  

---

## Project Structure
```
.
├── backend
│   ├── app
│   │   ├── __init__.py             # Flask app factory and extension setup
│   │   ├── blocklist.py            # JWT blocklist store
│   │   ├── config.py               # App + Test configuration
│   │   ├── extensions.py           # SQLAlchemy, Migrate, JWT init
│   │   ├── models/                 # ORM models: User, Event, Entrant, Match, Hero
│   │   └── routes/                 # Flask Blueprints: auth, events, entrants, matches, heroes
│   ├── migrations/                 # Alembic migration scripts
│   ├── scripts/                    # DB helper scripts (seed/reset/clear)
│   ├── seeds/                      # JSON seed data for users, events, matches, etc.
│   ├── tests/                      # Pytest suite for backend routes and models
│   ├── manage.py                   # Migration CLI entrypoint
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile.backend          # Backend Docker config
│   └── wsgi.py                     # Production entrypoint
├── frontend
│   ├── src
│   │   ├── components/             # React components (Dashboard, EventDetail, Registration, etc.)
│   │   ├── context/                # Auth + global context providers
│   │   ├── __tests__/              # Vitest + RTL frontend test files
│   │   ├── api.js                  # Centralized API helper using fetch
│   │   ├── main.jsx                # React root entrypoint
│   │   ├── setupTests.js           # RTL setup for Vitest
│   │   └── test-utils.jsx          # Custom render helpers (with router/context)
│   ├── public/                     # Static assets
│   ├── vite.config.js              # Vite build + proxy config
│   ├── package.json                # Frontend dependencies
│   └── Dockerfile.frontend         # Frontend Docker config
├── docker-compose.yml              # Combined stack (frontend, backend, db)
├── pytest.ini                      # Pytest configuration
└── README.md                       # Project documentation
```

---

## Known Issues
- `MUI Select` components require test environment mocking for stable interaction  
- `localStorage` persistence is used for MVP; dynamic fetching planned for future releases  
- Issues accessing images from [Superhero API](https://superheroapi.com/index.html) with backend auth  
- Seed resets currently clear all data (including user-created records); persistence separation not yet implemented
- Analytics endpoints use aggregated mock data for now
- Some admin controls still visible on event detail pages for user-facing experience
- Hero image fetching from external API may fail intermittently

## Future Improvements
- Add analytics tab for win/loss trends and entrant performance  
- Replace `localStorage` with API-based entrant fetching  
- Enhance error handling and loading UX across components  


---

## About This Repo
**Author:** Nick Rathbone | [GitHub Profile](https://github.com/nrathbone-turing)

This project is part of the Flatiron School Capstone course.

**License:** MIT — feel free to use or remix!