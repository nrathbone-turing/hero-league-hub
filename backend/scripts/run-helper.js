// File: backend/scripts/run-helper.js
// Purpose: Smart runner that defaults to DOCKER when not inside a pipenv shell,
//          and uses LOCAL (pipenv) when PIPENV_ACTIVE is present.
// Extras:
// - Automatically ensures Postgres and backend containers are up
// - Verifies migrations folder before running Alembic commands
// - Runs dual-db upgrades in LOCAL mode (main + test)
// - Passes through extra CLI args for pytest or migration messages

import { execSync } from "child_process";

const args = process.argv.slice(2);
const command = args[0];
const passthrough = args.slice(1);

// Detect environment
const inPipenv = !!process.env.PIPENV_ACTIVE;
const forced = (process.env.RUN_MODE || "").toLowerCase();
const useLocal = forced === "local" ? true : forced === "docker" ? false : inPipenv;
const MODE = useLocal ? "LOCAL" : "DOCKER";

const log = (m) => console.log(m);

// Docker helpers
const dockerEnvFlags = (env = {}) =>
  Object.entries(env)
    .map(([k, v]) => `-e ${k}=${String(v).replace(/"/g, '\\"')}`)
    .join(" ");

// --- Base Commands ---
const baseLocal = "pipenv run";
const baseDocker = (env = {}) =>
  `docker compose exec -T -w /app ${dockerEnvFlags(env)} backend`;

// --- Safe Runner ---
const run = (cmd, env = {}) => {
  log(`🏃 Running: ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
  } catch (err) {
    console.error(`❌ Command failed: ${err.message}`);
    process.exit(typeof err.status === "number" ? err.status : 1);
  }
};

const runLocal = (cmd, env = {}) => run(`${baseLocal} ${cmd}`, env);

const runDocker = (cmd, env = {}) => {
  // Verify /app/backend/migrations exists before running Alembic commands
  try {
    execSync(
      "docker compose exec -T backend bash -lc '[ -d /app/backend/migrations ] || mkdir -p /app/backend/migrations'",
      { stdio: "inherit" }
    );
  } catch (e) {
    console.warn("⚠️ Could not verify or create /app/backend/migrations directory");
  }

  run(`${baseDocker(env)} ${cmd}`, env);
};

// --- Docker Helpers ---
const ensureDockerUp = () => run("docker compose up -d db backend");

const waitForDb = () =>
  run('docker compose exec -T db bash -lc "until pg_isready -U postgres -h localhost; do sleep 1; done"');

const ensureTestDbDocker = (dbname = "heroleague_test") => {
  const checkCmd = `docker compose exec -T db psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${dbname}'"`;
  try {
    const out = execSync(checkCmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (out !== "1") {
      log(`🆕 Creating test database '${dbname}'...`);
      run(`docker compose exec -T db createdb -U postgres ${dbname}`);
    } else {
      log(`✅ Test database '${dbname}' exists`);
    }
  } catch {
    log(`ℹ️ Could not verify presence of '${dbname}', attempting to create...`);
    run(`docker compose exec -T db createdb -U postgres ${dbname}`);
  }
};

// --- Database Commands ---
const dbInit = () => {
  if (MODE === "LOCAL") {
    runLocal("flask --app backend/manage.py db init");
  } else {
    ensureDockerUp();
    waitForDb();
    runDocker("pipenv run flask --app backend/manage.py db init", {
      FLASK_ENV: "development",
    });
  }
};

const dbMigrate = () => {
  const msg = passthrough.length ? passthrough.join(" ") : "Auto migration";
  const quoted = `"${msg.replace(/"/g, '\\"')}"`;

  if (MODE === "LOCAL") {
    runLocal(`flask --app backend/manage.py db migrate -m ${quoted}`);
  } else {
    ensureDockerUp();
    waitForDb();
    runDocker(`pipenv run flask --app backend/manage.py db migrate -m ${quoted}`, {
      FLASK_ENV: "development",
    });
  }
};

const dbUpgrade = () => {
  if (MODE === "LOCAL") {
    log("🏗️ Upgrading main and test databases...");
    runLocal("flask --app backend/manage.py db upgrade", { FLASK_ENV: "development" });
    runLocal("flask --app backend/manage.py db upgrade", { FLASK_ENV: "test" });
  } else {
    ensureDockerUp();
    waitForDb();
    runDocker("pipenv run flask --app backend/manage.py db upgrade", {
      FLASK_ENV: "development",
    });
  }
};

const dbSeed = () => {
  if (MODE === "LOCAL") {
    log("🌱 Seeding local database...");
    runLocal("python -m backend.manage seed-db", { FLASK_ENV: "development" });
  } else {
    ensureDockerUp();
    waitForDb();
    log("🌱 Seeding database inside Docker...");
    runDocker("pipenv run python -m backend.manage seed-db", {
      FLASK_ENV: "development",
    });
  }
};

const dbReset = () => {
  if (MODE === "LOCAL") {
    runLocal("python backend/manage.py reset-db", { FLASK_ENV: "development" });
  } else {
    ensureDockerUp();
    waitForDb();
    runDocker("pipenv run python backend/manage.py reset-db", {
      FLASK_ENV: "development",
    });
  }
};

// --- Test Runner ---
const runTests = () => {
  if (MODE === "LOCAL") {
    log("🔧 Environment detected: LOCAL (pipenv)");
    runLocal(`pytest -q --disable-warnings backend/tests ${passthrough.join(" ")}`, {
      FLASK_ENV: "test",
    });
  } else {
    log("🐳 Environment detected: DOCKER");
    ensureDockerUp();
    waitForDb();
    ensureTestDbDocker("heroleague_test");
    dbUpgrade(); // Run migrations before tests
    runDocker(
      `pipenv run pytest -q --disable-warnings backend/tests ${passthrough.join(" ")}`,
      { FLASK_ENV: "test" }
    );
  }
};

// --- Dispatcher ---
try {
  switch (command) {
    case "test":
    case "backend":
      runTests();
      break;
    case "db:init":
      dbInit();
      break;
    case "db:migrate":
      dbMigrate();
      break;
    case "db:upgrade":
      dbUpgrade();
      break;
    case "db:seed":
      dbSeed();
      break;
    case "db:reset":
      dbReset();
      break;
    default:
      console.log(
        [
          "❓ Unknown command.",
          "Available:",
          "  test | backend",
          "  db:init | db:migrate [message] | db:upgrade | db:seed | db:reset",
          "",
          "Tips:",
          "  - FORCE mode: RUN_MODE=local or RUN_MODE=docker",
          "  - Extra pytest args pass through: e.g. `node ... test -k heroes`",
        ].join("\n")
      );
      process.exit(2);
  }
} catch (err) {
  console.error("❌ Unexpected error:", err?.message || err);
  process.exit(1);
}
