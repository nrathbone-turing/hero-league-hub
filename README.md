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

Following Project 1 ([Hero vs Villain Showdown](https://github.com/nrathbone-turing/hero-vs-villain-rps-showdown))  
and Project 2 ([Hero Tournament Manager](https://github.com/nrathbone-turing/hero-tournament-manager)),  
this project extends the theme into the **player experience**.

Instead of simulating one-off battles (Project 1) or focusing on event setup by admins (Project 2),  
this app gives participants their own interface:
- Users can register for events, select a hero, and track their progress through matches
- Heroes are chosen strategically, based on powerstats, usage rates, or win rates
- Analytics give players visibility into hero popularity and performance across events

This creates a distinct but connected trilogy:
- **Project 1:** Rock–Paper–Scissors hero duels via the [SuperHero API](https://superheroapi.com/)  
- **Project 2:** Tournament CRUD system for admins  
- **Project 3 (this app):** Player dashboards + hero analytics

---

## Tech Stack
- **Backend:** Flask, Flask-Migrate, Flask-SQLAlchemy, Flask-JWT-Extended
- **Frontend:** React, Vite, MUI (Material UI), Recharts
- **Database:** Postgres 15 (via Docker)
- **Dev Tools:** Docker Compose, Black, Flake8, Pytest, Pipenv

---

## Getting Started

You can run Hero League Hub in two modes:
1. **Local Development** --> Uses Pipenv + host Postgres
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
| **DOCKER** | Default when not inside Pipenv or `RUN_MODE=docker` | Runs commands inside backend container and ensures DB health |

**Highlights:**
- Auto-runs migrations before tests
- Auto-creates test DB (`heroleague_test`)
- Passes CLI args (e.g., `npm run test:backend -- -k heroes`)
- Logs detected environment at runtime

**Example Output:**
```bash
# Local (inside pipenv shell)
npm run test:backend
# 🧠 Detects LOCAL --> pipenv run pytest -q backend/tests

# Docker (outside pipenv)
npm run test:backend
# 🐳 Detects DOCKER --> docker compose exec backend pipenv run pytest -q backend/tests
```

---

### Default Users (for development & testing)
These accounts are automatically seeded when you run `npm run db:seed` or `npm run db:reset`; you can use these to explore the dashboard and registration flow without creating a new account.

**Admin User**
- Email: `admin@example.com`
- Password: `admin`

**Demo Player**
- Email: `demo@example.com`
- Password: `password123`

---

## Database Management
```bash
# Database utilities
npm run db:init         # Initialize migrations
npm run db:migrate      # Create new migration file
npm run db:upgrade      # Apply migrations (main + test DBs)
npm run db:seed         # Seed sample data
npm run db:reset        # Drop, recreate, reseed
```
All use the same helper script with auto environment detection and y
You can also call the CLI directly if needed:
```bash
pipenv run flask --app backend/manage.py seed-db
```

### New Combined Scripts
To simplify full-stack workflows, these scripts automatically detect your environment (Docker or local Pipenv) and handle rebuilds, migrations, seeding, and testing accordingly.
```bash
npm test                # Run backend + frontend tests
npm run docker:rebuild  # Stop, rebuild, restart all containers
npm run test:full       # Full rebuild --> migrate --> seed --> run tests
npm run dev:all         # Rebuild containers and start frontend dev server
```

#### Notes:
- Run all scripts from the project root
- `test:full` resets DBs before testing
- `dev:all` is ideal for live development
- Console logs show environment (`LOCAL` 🧠 or `DOCKER` 🐳)

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
- **Backend**: Pytest + fixtures (backend/tests/conftest.py)
- **Frontend**: Vitest + RTL (frontend/src/__tests__/)
- Auto-upgrades + seeds test DB before running

--

## Event Registration Flow
- **Frontend**: User selects a hero + event
- **Backend**: `/api/entrants/register` creates entrant tied to the logged-in user
- **Database**: Writes entry to `entrants` table

Validation Logic:
- Only published events visible
- Prevents duplicate registration
- Updates dashboard dynamically after registration

---

## Feature Flow Summary (With Screenshots)

Below are the key user flows in **Hero League Hub**, showing how players can log in, browse events, select heroes, register, and view their progress — all from a unified dashboard.

---

### Authentication & Onboarding
Players begin by creating an account or logging in.

![Signup page](./frontend/public/screenshots/Signup%20page.png)
![Login page](./frontend/public/screenshots/Login%20page.png)

---

### Events Overview & Registration Flow
Users can browse completed and published events, filter by status, and register a hero for participation.

![Filtered Events by Status](./frontend/public/screenshots/Filtered%20Events%20by%20Status.png)
![Default Sort Events page & Register button](./frontend/public/screenshots/Default%20Sort%20Events%20page%20+%20Register.png)
![Event Registration form](./frontend/public/screenshots/Event%20Registration%20form%20event%20and%20hero%20selected.png)
![Hero dropdown filter](./frontend/public/screenshots/Event%20Registration%20form%20hero%20select%20dropdown%20filter%20keyword%20search.png)

---

### Hero Search & Selection
Players can search or filter heroes from the external API, preview stats, and confirm selection to replace an existing entrant record.

![Hero search results](./frontend/public/screenshots/Heroes%20search%20results%20filtering%20based%20on%20external%20API%20pull.png)
![Hero modal - character image](./frontend/public/screenshots/Heroes%20search%20dialog%20modal%201.png)
![Hero modal - character details](./frontend/public/screenshots/Heroes%20search%20dialog%20modal%202.png)
![Overwrite hero confirmation](./frontend/public/screenshots/Choose%20another%20hero%20overwrite%20current%20hero%20if%20already%20registered.png)

---

### Event Details
Displays current event registration, entrant stats, and live updates as matches progress.

![Event details registered no matches](./frontend/public/screenshots/EventDetails%20page%20registered%20no%20matches.png)
![Event details with matches](./frontend/public/screenshots/EventDetails%20page%20registered%20with%20matches.png)
![Event details show 'Dropped' after withdrawing](./frontend/public/screenshots/EventDetails%20page%20withdraw%20with%20matches%20become%20dropped.png)

---

### User Dashboard
Central hub for players to manage their hero choice, view registration status, and make updates to existing selections.

![Dashboard hero + event](./frontend/public/screenshots/User%20dashboard%20hero%20chosen%20and%20event%20registered.png)
![Dashboard updated](./frontend/public/screenshots/User%20Dashboard%20updated%20after%20registering%20for%20event%20and%20choosing%20hero.png)
![Cancel registration alert](./frontend/public/screenshots/Cancel%20registration%20button%20with%20alert%20confirmation.png)

---

### Analytics & Insights
Shows aggregated hero data like usage, win rates, and participation across events.

![Hero usage chart](./frontend/public/screenshots/Analytics%20hero%20usage%20tab%20pie%20chart.png)
![Hero win rates chart](./frontend/public/screenshots/Analytics%20hero%20win%20rates%20vertical%20bar%20chart.png)
![Hero participation chart](./frontend/public/screenshots/Analytics%20hero%20participation%20vertical%20bar%20chart.png)

---

## API Endpoints
### Auth
- `POST /api/signup` --> Create a new user account  
- `POST /api/login` --> Authenticate and receive JWT  
- `DELETE /api/logout` --> Revoke token and clear session  

### Events
- `GET /api/events` --> List all events (with status + date)
- `GET /api/events/:id` --> Retrieve detailed event info (entrants, matches)

### Entrants
- `POST /api/entrants/register` --> Register a logged-in user + hero for an event  
- `DELETE /api/entrants/unregister/:event_id` --> Withdraw entrant from event  
- `GET /api/entrants?event_id=X&user_id=Y` --> Fetch entrant details for a user/event  

### Matches
- `GET /api/matches?event_id=X` --> List all matches for a given event  

### Analytics
- `GET /api/analytics/usage` --> Hero participation and event distribution  
- `GET /api/analytics/results` --> Aggregate win/loss outcomes  
- `GET /api/analytics/heroes` --> Hero usage + win rate summaries

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

### Entity Relationship Diagram (ERD)
This diagram illustrates the relationships between users, heroes, events, entrants, and matches within Hero League Hub.  
Entrants act as the central join table — linking each user’s chosen hero to a specific event and allowing match results and analytics to be tied together seamlessly.

![Hero League Hub – Entity Relationship Diagram (ERD)](./frontend/public/Hero%20League%20Hub%20ERD.jpeg)

Full-sized diagram available on [Lucidchart](https://lucid.app/lucidchart/1ee204f1-6aae-423c-8d5d-29721f41a476/edit?view_items=LDKVFQbEoa1b&invitationId=inv_ce5ba8a7-bf7a-4af5-be3c-aa86228c2a80)

---

## Project Structure
```bash
.
├── backend/                         # Flask backend
│   ├── app/                         # Core application package
│   │   ├── __init__.py              # Flask app factory + extension initialization
│   │   ├── blocklist.py             # JWT token blocklist for revoked tokens
│   │   ├── config.py                # Environment-aware configuration (Docker/local)
│   │   ├── extensions.py            # SQLAlchemy, Migrate, and JWT setup
│   │   ├── models/                  # ORM models (User, Hero, Event, Entrant, Match)
│   │   └── routes/                  # REST API route blueprints
│   ├── Dockerfile.backend           # Backend container definition
│   ├── manage.py                    # Flask CLI entry (migrate, seed, reset)
│   ├── requirements.txt             # Backend dependency list
│   ├── scripts/                     # Helper scripts and SQL setup
│   │   ├── initdb/                  # Database initialization SQL scripts
│   │   ├── run-helper.js            # Smart runner: detects Docker vs Pipenv
│   │   └── seed_db.py               # Seeds sample data into tables
│   ├── seeds/                       # JSON data for seeding local dev
│   ├── tests/                       # Backend pytest suite
│   └── wsgi.py                      # Production entrypoint
│
├── frontend/                        # React frontend
│   ├── public/                      # Static assets
│   │   ├── screenshots/             # App screenshots for documentation
│   │   └── vite.svg                 # Default Vite logo
│   ├── src/                         # Source code
│   │   ├── __tests__/               # Vitest + React Testing Library tests
│   │   ├── components/              # React components and pages
│   │   ├── context/                 # Global AuthContext provider
│   │   ├── utils/                   # Shared helpers (filters, formatters)
│   │   ├── api.js                   # API wrapper for fetch calls
│   │   ├── setupTests.js            # Global test setup (mocks, JSDOM)
│   │   ├── test-utils.jsx           # Render helpers for testing with Router/Auth
│   │   ├── main.jsx                 # React entry point
│   │   ├── App.jsx / App.css        # Root component and global styling
│   │   └── index.css                # Theme + layout styling
│   ├── vite.config.js               # Dev/build configuration
│   ├── eslint.config.js             # ESLint setup for frontend
│   ├── index.html                   # Root HTML template
│   ├── package.json                 # Frontend scripts/dependencies
│   └── package-lock.json
│
├── docker-compose.yml               # Multi-container orchestration (backend, db, frontend)
├── Dockerfile.frontend              # Frontend container definition
│
├── Pipfile / Pipfile.lock           # Pipenv environment + dependencies
├── pyproject.toml                   # Formatting/linting tools (Black, Flake8)
├── pytest.ini                       # Pytest configuration
├── LICENSE                          # MIT license
├── package.json                     # Unified npm scripts (root-level commands)
└── README.md                        # Documentation (this file)
```

---

## Known Issues
- External hero images occasionally fail
- Some analytics still mock data
- Some admin routes visible on user-facing pages
- Seed resets data (no persistence separation yet)
- Minor UI flicker on Analytics tab switch
- Frontend tests rely on `vi.fn` mocks for fetch requests
- Withdraw button not wired to entrant deletion
- Add fallback image for missing heroes
- Need dashboard link in navbar
- Move hero search table's sorting logic to backend

---

## Future Improvements
- Bracket visualization
- Per-user + matchup analytics
- Persistent vs. demo DB separation
- Improved error + loading UX
- Full analytics/auth test coverage
- Utilize alias field for hero metadata
- Add `created_at` and `updated_at` audit fields to models

---

## About This Repo
**Author:** Nick Rathbone | [GitHub Profile](https://github.com/nrathbone-turing)

This project is part of the Flatiron School Capstone course.

**License:** MIT — feel free to use or remix!