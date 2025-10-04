// File: backend/scripts/run-helper.js
// Purpose: Smart runner that defaults to DOCKER when not inside a pipenv shell,
//          and uses LOCAL (pipenv) when PIPENV_ACTIVE is present.
// Extras:
// - Forces test env for pytest
// - In Docker mode: ensures services are up, waits for DB, creates test DB if missing
// - Pass-through of extra CLI args to underlying commands

import { execSync } from "child_process";

const args = process.argv.slice(2);
const command = args[0];
const passthrough = args.slice(1); // anything after the subcommand

// --- Mode detection & optional override ---
const inPipenv = !!process.env.PIPENV_ACTIVE;
const forced = (process.env.RUN_MODE || "").toLowerCase(); // 'docker'|'local'
const useLocal = forced === "local" ? true : forced === "docker" ? false : inPipenv;
const MODE = useLocal ? "LOCAL" : "DOCKER";

const log = (m) => console.log(m);

// Build docker exec with optional env overrides
const dockerEnvFlags = (env = {}) =>
  Object.entries(env)
    .map(([k, v]) => `-e ${k}=${String(v).replace(/"/g, '\\"')}`)
    .join(" ");

const baseLocal = "pipenv run";
const baseDocker = (env = {}) => `docker compose exec -T ${dockerEnvFlags(env)} backend`;

const run = (cmd, env = {}) => {
  log(`🏃 Running: ${cmd}`);
  try {
    execSync(cmd, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
  } catch (err) {
    console.error(`❌ Command failed: ${err.message}`);
    process.exit(typeof err.status === "number" ? err.status : 1);
  }
};

const runLocal = (cmd, env = {}) => run(`${baseLocal} ${cmd}`, env);
const runDocker = (cmd, env = {}) => run(`${baseDocker(env)} ${cmd}`);

// --- Docker helpers (no-ops in local mode) ---
const ensureDockerUp = () => {
  // Idempotent: starts (or keeps up) db+backend
  run("docker compose up -d db backend");
};

const waitForDb = () => {
  // Wait until Postgres is ready
  run('docker compose exec -T db bash -lc "until pg_isready -U postgres -h localhost; do sleep 1; done"');
};

const ensureTestDbDocker = (dbname = "heroleague_test") => {
  // Create test DB inside the db container if missing
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
    // If the check fails, make a best effort to create
    log(`ℹ️ Could not verify presence of '${dbname}', attempting to create...`);
    run(`docker compose exec -T db createdb -U postgres ${dbname}`);
  }
};

const applyMigrationsIfNeeded = () => {
  // Safe to run before tests; no-op if already up-to-date
  runDocker('pipenv run flask --app backend/manage.py db upgrade', {
    FLASK_ENV: "development",
  });
};

// --- Dispatchers ---
const runTests = () => {
  if (MODE === "LOCAL") {
    log("🔧 Environment detected: LOCAL (pipenv)");
    // Force test env locally
    runLocal(`pytest -q --disable-warnings backend/tests ${passthrough.join(" ")}`, {
      FLASK_ENV: "test",
    });
  } else {
    log("🐳 Environment detected: DOCKER");
    ensureDockerUp();
    waitForDb();
    ensureTestDbDocker("heroleague_test");
    applyMigrationsIfNeeded(); // optional but helpful

    // Force test env inside the backend container
    runDocker(
      `pipenv run pytest -q --disable-warnings backend/tests ${passthrough.join(" ")}`,
      { FLASK_ENV: "test" }
    );
  }
};

const dbInit = () => {
  if (MODE === "LOCAL") {
    runLocal("flask --app backend/manage.py db init");
  } else {
    ensureDockerUp();
    waitForDb();
    runDocker("pipenv run flask --app backend/manage.py db init", { FLASK_ENV: "development" });
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
    runLocal("flask --app backend/manage.py db upgrade");
  } else {
    ensureDockerUp();
    waitForDb();
    runDocker("pipenv run flask --app backend/manage.py db upgrade", { FLASK_ENV: "development" });
  }
};

const dbSeed = () => {
  if (MODE === "LOCAL") {
    runLocal("python backend/manage.py seed-db");
  } else {
    ensureDockerUp();
    waitForDb();
    runDocker("pipenv run python backend/manage.py seed-db", { FLASK_ENV: "development" });
  }
};

const dbReset = () => {
  if (MODE === "LOCAL") {
    runLocal("python backend/manage.py reset-db");
  } else {
    ensureDockerUp();
    waitForDb();
    runDocker("pipenv run python backend/manage.py reset-db", { FLASK_ENV: "development" });
  }
};

// --- Main switch ---
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
