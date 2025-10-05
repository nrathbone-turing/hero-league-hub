# Hero League Hub

Participant-facing app for managing hero event registrations, matches, and analytics.
Built with **Flask (backend)**, **React + Vite (frontend)**, and **Postgres** for persistence.

## New Feature Highlights
- **Analytics Dashboards** --> Hero usage, win rates, and participation trends via `/api/analytics/*`
- **Hero League Insights** --> Aggregated hero stats across events
- **Event Registration Flow** --> Users register heroes for published events
- **Player Dashboards** --> Entrant stats, past events, and match history
- **Unified Test & DB Runner** --> Smart script auto-detects Docker vs. Pipenv
- **JWT Auth Integration** --> Secure login, logout, and session refresh

---

## Screenshots

_Coming soon — include Analytics dashboard preview, event detail, and registration flow screenshots._
- Analytics
- Event Detail
- Registration flow

---

## Tech Stack
- **Backend:** Flask, Flask-Migrate, Flask-SQLAlchemy, Flask-JWT-Extended
- **Frontend:** React, Vite, MUI (Material UI)
- **Database:** Postgres 15 (via Docker)
- **Dev Tools:** Docker Compose, Black, Flake8, Pytest, Pipenv

---

## Getting Started

You can run Hero League Hub in two modes:
1. **Local Development** --> Uses Pipenv and your host machine’s Postgres
2. **Docker Compose** --> Spins up backend, frontend, and Postgres automatically

### Local (Recommended for Backend Development)
```bash
# Backend setup
pipenv install
pipenv shell
createdb heroleague
createdb heroleague_test
npm run db:upgrade
npm run db:seed
python backend/wsgi.py  # Runs at http://localhost:5500
```

```bash
# Frontend setup
cd frontend
npm install
npm run dev  # Runs at http://localhost:3000
```

---

### Docker Compose (Full Stack Environment)
Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
docker compose up --build
```

This will start:
- **Backend** --> http://localhost:5500
- **Frontend** --> http://localhost:3000
- **Postgres** --> localhost:5432

To stop everything:
```bash
docker compose down
```

---

## Unified Helper Logic

The `backend/scripts/run-helper.js` script automatically detects your environment and routes commands appropriately.

| Mode | Detection | Behavior |
|------|------------|-----------|
| **LOCAL (Pipenv)** | Detected via `PIPENV_ACTIVE` or `RUN_MODE=local` | Runs all commands with `pipenv run` directly on your host machine (requires local Postgres) |
| **DOCKER** | Default when not inside Pipenv or `RUN_MODE=docker` | Spins up `db` + `backend` containers, waits for Postgres health, ensures test DB exists, then runs commands inside the backend container |

**Highlights:**
- Runs migrations automatically before tests
- Creates test DB (`heroleague_test`) if missing
- Passes through CLI args (e.g., `npm run test:backend -- -k heroes`)
- Standardized syntax for both modes — no manual switching required!
- Logs the detected environment so you always know where it’s running

**Example Output:**
```bash
# Local (inside pipenv shell)
npm run test:backend
# 🧠 Detects LOCAL --> pipenv run pytest -q --disable-warnings backend/tests

# Docker (outside pipenv)
npm run test:backend
# 🐳 Detects DOCKER --> docker compose exec backend pipenv run pytest -q --disable-warnings backend/tests
```

---

## Database Management
```bash
# Database utilities
npm run db:init         # Initialize migrations
npm run db:migrate      # Create new migration file
npm run db:upgrade      # Apply migrations (main + test DBs)
npm run db:seed         # Seed events, heroes, users, entrants, matches
npm run db:reset        # Drop, recreate, and reseed from scratch
```
These use the **same helper** for automatic environment detection.
You can also call the CLI directly if needed:
```bash
pipenv run flask --app backend/manage.py seed-db
```

### Command Behavior Summary
| Command | Local (Pipenv) Behavior | Docker Behavior |
|----------|-------------------------|------------------|
| **`db:init`** | Initializes Alembic migrations in `/backend/migrations` | Runs the same command inside the backend container |
| **`db:migrate`** | Creates a new migration file using Flask-Migrate | Same behavior inside the backend container |
| **`db:upgrade`** | Applies migrations to both main and test databases | Waits for DB health, then applies migrations inside container |
| **`db:seed`** | Runs `backend/manage.py seed-db` to populate all tables | Executes the same seeding process within the backend container |
| **`db:reset`** | Drops, recreates, and reseeds all tables (local Postgres) | Performs full schema reset inside container using helper script |
| **`test:backend`** | Runs pytest locally via `pipenv run` | Executes pytest inside backend container with auto DB setup |
| **`test:frontend`** | Runs Vitest + RTL suite for React components | Runs identical frontend test suite using Node in host environment |
| **`test:full`** | Full rebuild --> migrate --> seed --> run both suites | Performs same workflow in Dockerized environment |

### New Combined Scripts
To simplify full-stack workflows, these scripts automatically detect your environment (Docker or local Pipenv) and handle rebuilds, migrations, seeding, and testing accordingly.
```bash
npm test                # Runs backend + frontend tests (auto Docker/local detection)
npm run docker:rebuild  # Stop, rebuild, and restart all containers
npm run test:full       # Full rebuild --> migrate --> seed --> run backend + frontend tests
npm run dev:all         # Rebuild containers and start frontend dev server
```

#### Notes:
- All scripts run from the project root
- `test:full` ensures a clean database before running both suites
- `dev:all` is ideal for quick restarts during active development
- Logs environment detection at runtime (`LOCAL` 🧠 or `DOCKER` 🐳)

---

## Running Tests
```bash
# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend

# Both (auto-detects env + runs sequentially)
npm test
```

### Notes
- Backend tests use Pytest + fixtures (`backend/tests/conftest.py`)
- Frontend uses Vitest + React Testing Library (`frontend/src/__tests__/`)
- The helper auto-creates and upgrades the test DB before running
- All tests can be run identically from inside or outside Docker

---

## Event Registration Flow
- **Frontend** --> User selects a hero and event
- **Backend** --> `/api/entrants/register` creates an entrant tied to the logged-in user
- **Database** --> Entry saved in `entrants` table

Validation Logic:
- Only published events appear
- Prevents duplicate user registrations
- Auto-updates entrant dashboards after registration

---

## API Endpoints
### Auth
- `POST /api/signup` --> Create a new user account  
- `POST /api/login` --> Authenticate and receive/return JWT  
- `DELETE /api/logout` --> Revoke token and clear session (adds to blocklist)

### Events
- `GET /api/events` --> List all events (sorted by date/status)
- `POST /api/events` --> Create a new event *(admin only)*
- `PUT /api/events/:id` --> Update event details or status  *(admin only)*
- `DELETE /api/events/:id` --> Delete an event *(admin only)*

### Entrants
- `POST /api/entrants/register` --> Register a user + hero for an event  
- `DELETE /api/entrants/unregister/:event_id` --> Remove entrant from event  
- `GET /api/entrants?event_id=X&user_id=Y` --> Filter entrants by user/event  
- `PUT /api/entrants/:id` --> Update entrant info *(admin only)*  
- `DELETE /api/entrants/:id` --> Hard/soft delete entrant *(admin only)*  

### Matches
- `GET /api/matches?event_id=X` --> List all matches for an event  
- `POST /api/matches` --> Create new match *(admin only)*  
- `PUT /api/matches/:id` --> Update score/winner *(admin only)*  
- `DELETE /api/matches/:id` --> Delete match *(admin only)*  

### Analytics
- `/api/analytics/usage` --> Participation stats  
- `/api/analytics/results` --> Match outcomes  
- `/api/analytics/heroes` --> Hero usage + win rates

---

## Data Models

**User**
- `id` --> Integer (Primary key)
- `username` --> String (Unique display name)
- `email` --> String (Unique login email)
- `password_hash` --> String (Hashed password)
- `is_admin` --> Boolean (Admin privilege flag)

**Hero**
- `id` --> Integer (External SuperHero API ID)
- `name` --> String (Hero’s public name)
- `full_name` --> String (Real/full name)
- `alignment` --> String (`"hero"`, `"villain"`, `"antihero"`, or `"unknown"`)
- `powerstats` --> JSON (Key-value hero stats)
- `image` --> String (Portrait URL)

**Event**
- `id` --> Integer (Primary key)
- `name` --> String (Event title)
- `date` --> String (ISO format)
- `rules` --> String (Format or rule set)
- `status` --> Enum (`"drafting"`, `"published"`, `"cancelled"`, `"completed"`)
- Relationships:
  - One event --> many entrants
  - One event --> many matches  

**Entrant**
- `id` --> Integer (Primary key)
- `user_id` --> FK --> `users.id`
- `hero_id` --> FK --> `heroes.id`
- `event_id` --> FK --> `events.id`
- `name` --> String (User display name)
- `alias` --> String (Hero alias for event)
- `dropped` --> Boolean (If entrant withdrew)
- `created_at`, `updated_at` --> DateTime (Audit fields)

**Match**
- `id` --> Integer (Primary key)
- `event_id` --> FK --> `events.id`
- `round` --> Integer (Round number)
- `entrant1_id`, `entrant2_id` --> FK --> `entrants.id`
- `scores` --> String (e.g., `"2-1"`)
- `winner_id` --> FK --> `entrants.id`  
- Relationships:
  - One event --> many matches
  - One entrant --> many matches

---

## Project Structure
```
.
├── backend
│   ├── app/
│   │   ├── __init__.py             # App factory and extension setup
│   │   ├── blocklist.py            # JWT blocklist handling
│   │   ├── config.py               # Dynamic Docker/local config detection
│   │   ├── extensions.py           # SQLAlchemy, Migrate, JWT initialization
│   │   ├── models/
│   │   │   ├── analytics_utils.py  # Aggregation helpers for analytics endpoints
│   │   │   └── models.py           # Core ORM models: User, Hero, Event, Entrant, Match
│   │   └── routes/
│   │       ├── analytics.py        # /api/analytics endpoints
│   │       ├── auth.py             # Auth routes
│   │       ├── entrants.py         # Entrant registration logic
│   │       ├── events.py           # Event CRUD
│   │       ├── heroes.py           # Hero API + search
│   │       └── matches.py          # Match CRUD + scoring
│   ├── manage.py                   # Unified Flask CLI (migrate, seed, reset)
│   ├── scripts/
│   │   ├── initdb/01-create-test-db.sql  # Auto-creates test DB in Docker
│   │   ├── run-helper.js           # Smart runner: auto-detects Docker vs Pipenv
│   │   └── seed_db.py              # Truncates + seeds all tables
│   ├── seeds/                      # JSON datasets (events, heroes, users, entrants, matches)
│   ├── tests/                      # Pytest backend suite
│   ├── migrations/                 # Alembic migrations
│   ├── requirements.txt            # Backend dependencies
│   ├── Dockerfile.backend          # Backend container config
│   └── wsgi.py                     # Production entrypoint
├── frontend
│   ├── src/
│   │   ├── components/             # React pages + dashboards
│   │   ├── context/                # AuthContext for login/session
│   │   ├── __tests__/              # Vitest + RTL test suite
│   │   ├── api.js                  # Fetch utilities
│   │   ├── setupTests.js           # Global Vitest/RTL setup
│   │   ├── test-utils.jsx          # Router + AuthContext test helpers
│   │   └── main.jsx                # Entry point
│   ├── vite.config.js              # Dev proxy + build config
│   ├── package.json                # Frontend scripts/deps
│   ├── Dockerfile.frontend         # Frontend container config
│   └── public/                     # Static assets
├── docker-compose.yml              # Full-stack orchestration
├── package.json                    # Unified npm scripts
├── pytest.ini                      # Pytest config
├── Pipfile / Pipfile.lock          # Pipenv environment
├── LICENSE                         # MIT license
└── README.md                       # Documentation (this file)
```

---

## Known Issues
- Hero images from [external API](https://superheroapi.com/index.html) may fail intermittently
- Some analytics still mock data
- Some admin controls and routes/endpoints visible on user-facing pages
- Seed resets all data (no persistence separation yet)
- Minor UI flicker when switching Analytics tabs
- Frontend tests rely on `vi.fn` mocks for fetch requests
- `MUI Select` components require test mocking for Vitest

## Future Improvements
- Bracket visualization for events
- Expanded analytics (per-user stats, matchup trends)
- Separate persistent vs. demo seed databases
- Improved error handling + loading UX
- Full test coverage of analytics + auth edge cases

---

## About This Repo
**Author:** Nick Rathbone | [GitHub Profile](https://github.com/nrathbone-turing)

This project is part of the Flatiron School Capstone course.

**License:** MIT — feel free to use or remix!