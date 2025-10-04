# Hero League Hub

Participant-facing app for managing hero event registrations, matches, and analytics.
Built with **Flask (backend)**, **React + Vite (frontend)**, and **Postgres** for persistence.

## New Feature Highlights
- **Analytics dashboards**: Hero usage, win rates, and participation trends via `/api/analytics/*`
- **Hero League Insights**: See aggregated hero stats across all events
- **Event Registration Flow**: Users can register heroes for published events
- **Player Dashboards**: View entrant stats, past events, and match records
- **Auth Integration**: Secure JWT-based login, logout, and session checks

---

## Screenshots

_Coming soon — include Analytics dashboard preview, event detail, and registration flow screenshots._

---

## Tech Stack
- **Backend:** Flask, Flask-Migrate, Flask-SQLAlchemy, Flask-JWT-Extended
- **Frontend:** React, Vite, MUI (Material UI)
- **Database:** Postgres 15 (via Docker)
- **Dev Tools:** Docker Compose, Black, Flake8, Pytest

---

## Getting Started

You can run Hero League Hub in two ways:
1. **Local Development (fast iteration)**
2. **Docker Compose (full stack environment)**

### Local (Recommended)
```bash
# Backend
cd backend
pip install -r requirements.txt
python wsgi.py  # runs at http://localhost:5500
```

```bash
# Frontend
cd frontend
npm install
npm run dev     # runs at http://localhost:3000
```

---

### Docker Compose (Full Stack)
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

## Event Registration Flow

- **Frontend**: User selects hero + event via form
- **Backend**: `/api/entrants/register` creates entrant tied to logged-in user
- **DB**: Entry stored in `entrants` with hero/event/user linkage

### Validation Logic
- Only published events shown in dropdowns
- Duplicate registration prevented per user/event
- Successful registration auto-updates User Dashboard

---

## Database Management

```bash
# Standard commands
npm run db:init         # Initialize migrations
npm run db:migrate      # Generate migration file
npm run db:upgrade      # Apply migrations
npm run db:seed         # Seed database
npm run db:reset        # Drop/recreate + seed
```

### New Combined Scripts
To simplify frequent full-stack workflows, these scripts handle container rebuilds, migrations, seeding, and tests automatically.

```bash
npm run docker:rebuild  # Stop, rebuild, and restart all containers in detached mode
npm run db:refresh      # Drop, recreate, upgrade, and reseed the database
npm run test:full       # Full rebuild -> migrate -> seed -> run backend + frontend tests
npm run dev:all         # Rebuild containers and launch frontend dev server

```
#### Notes:
- These can all be run from the **project root**
- `test:full` ensures a clean environment before running both backend and frontend suites
- `dev:all` is ideal for quickly spinning up the stack after a rebuild
---

## Running Tests
```bash
### Backend (pytest)
npm run test:backend

### Frontend (Vitest + RTL)
npm run test:frontend

### Full Suite
npm test
```

### Notes
- Backend tests live in `backend/tests/` and use fixtures defined in `conftest.py`
- Frontend tests live in `frontend/src/__tests__/` and rely on:
  - `setupTests.js` for global Vitest/RTL config
  - `test-utils.jsx` for router and AuthContext rendering helpers
- Backend tests connect to a dedicated Postgres test database via Docker (`heroleague_test`)

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

### Analytics
- `/api/analytics/usage` — Participation stats  
- `/api/analytics/results` — Match outcome summaries  
- `/api/analytics/heroes` — Hero usage + win rates
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
│   │   ├── blocklist.py            # JWT token blocklist for logout/session invalidation
│   │   ├── config.py               # Base, Dev, and Test configurations (Postgres-aware)
│   │   ├── extensions.py           # SQLAlchemy, Migrate, and JWT initialization
│   │   ├── models/                 # ORM models and analytics helpers
│   │   │   ├── analytics_utils.py  # Aggregation helpers for analytics endpoints
│   │   │   └── models.py           # Core models: User, Event, Entrant, Match, Hero
│   │   └── routes/                 # Flask Blueprints (modular API routes)
│   │       ├── analytics.py        # /api/analytics endpoints for hero/event insights
│   │       ├── auth.py             # /api/signup, /api/login, /api/logout
│   │       ├── entrants.py         # /api/entrants CRUD and registration logic
│   │       ├── events.py           # /api/events CRUD and publishing controls
│   │       ├── heroes.py           # /api/heroes CRUD and search endpoints
│   │       └── matches.py          # /api/matches CRUD and round/winner updates
│   ├── migrations/                 # Alembic migration scripts
│   │   └── versions/               # Auto-generated schema revisions
│   ├── scripts/                    # Utility scripts for DB management
│   │   └── seed_db.py              # Truncates + seeds tables with demo data
│   ├── seeds/                      # JSON datasets for events, heroes, entrants, users, matches
│   ├── tests/                      # Pytest backend suite
│   │   ├── conftest.py             # Shared test fixtures and app context
│   │   ├── test_analytics.py       # Tests for analytics endpoints and aggregations
│   │   ├── test_auth.py            # Tests for JWT auth routes
│   │   ├── test_models.py          # ORM integrity and relationship validation
│   │   ├── test_routes_entrants.py # Entrant API behavior and permissions
│   │   ├── test_routes_events.py   # Event CRUD and filtering tests
│   │   ├── test_routes_heroes.py   # Hero API queries and filters
│   │   └── test_routes_matches.py  # Match creation and score update tests
│   ├── manage.py                   # Unified Flask CLI (migrate, seed, reset)
│   ├── requirements.txt            # Python dependencies
│   ├── Dockerfile.backend          # Backend container configuration
│   └── wsgi.py                     # Production entrypoint for Gunicorn
├── frontend
│   ├── src/
│   │   ├── components/             # React components (Dashboards, Registration, Analytics)
│   │   ├── context/                # AuthContext + global state providers
│   │   ├── __tests__/              # Vitest + RTL component/unit tests
│   │   │   ├── Analytics.test.jsx  # Analytics tab switching + chart rendering tests
│   │   │   ├── EventDetail.test.jsx
│   │   │   ├── Heroes.test.jsx
│   │   │   └── ...                 # Additional component tests
│   │   ├── api.js                  # Centralized API utilities (fetch wrapper)
│   │   ├── setupTests.js           # Vitest + RTL setup and global config (imported by test suite)
│   │   ├── test-utils.jsx          # Custom render helper for router + context mocking
│   │   ├── main.jsx                # Root React entrypoint
│   │   └── index.css               # Global styles
│   ├── vite.config.js              # Vite dev server + proxy config
│   ├── package.json                # Frontend dependencies + scripts
│   ├── Dockerfile.frontend         # Frontend container configuration
│   └── public/                     # Static assets (logos, icons)
├── docker-compose.yml              # Combined stack (frontend, backend, Postgres)
├── package.json                    # Root project scripts (lint, test, db, docker)
├── pytest.ini                      # Pytest configuration for backend
├── LICENSE                         # MIT license
└── README.md                       # Project documentation
```

---

## Known Issues
- Hero API images from external API [Superhero API](https://superheroapi.com/index.html) occasionally fail due to remote limits
- Analytics endpoints still mock aggregate data
- Some admin controls visible on user-facing pages
- Seed script resets all tables (including user data); persistence separation not yet implemented
- Frontend tests rely on `vi.fn` mocks for fetch requests
- `MUI Select` components require test environment mocking for stable interaction

## Future Improvements
- Enhance error handling and loading UX across components
- Improve test coverage for analytics edge cases
- Replace analytics mock data with live queries
- Add per-hero historical performance view
- Introduce pagination + caching for heavy queries
- Separate persistent and demo databases

---

## About This Repo
**Author:** Nick Rathbone | [GitHub Profile](https://github.com/nrathbone-turing)

This project is part of the Flatiron School Capstone course.

**License:** MIT — feel free to use or remix!