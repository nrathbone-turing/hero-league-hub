// File: backend/scripts/run-helper.js
// Purpose: Smart runner that detects LOCAL vs DOCKER environments for backend + frontend tooling.
// Supports linting, formatting, testing, migrations, and combined quality checks.

import { execSync } from "child_process";

const args = process.argv.slice(2);
const command = args[0];
const passthrough = args.slice(1);

// --- Environment Detection ---
const inPipenv = !!process.env.PIPENV_ACTIVE;
const forced = (process.env.RUN_MODE || "").toLowerCase();
const useLocal = forced === "local" ? true : forced === "docker" ? false : inPipenv;
const MODE = useLocal ? "LOCAL" : "DOCKER";

if (MODE === "LOCAL") {
  console.log("🧠 Detects LOCAL → using pipenv shell environment");
} else {
  console.log("🐳 Detects DOCKER → using docker compose backend service");
}

const log = (m) => console.log(m);

// --- Docker Helpers ---
const dockerEnvFlags = (env = {}) =>
  Object.entries(env)
    .map(([k, v]) => `-e ${k}=${String(v).replace(/"/g, '\\"')}`)
    .join(" ");

const baseLocal = "pipenv run";
const baseDocker = (env = {}) => `docker compose exec -T -w /app ${dockerEnvFlags(env)} backend`;

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
const runDocker = (cmd, env = {}) => run(`${baseDocker(env)} ${cmd}`, env);

const ensureDockerUp = () => run("docker compose up -d db backend");
const waitForDb = () =>
  run('docker compose exec -T db bash -lc "until pg_isready -U postgres -h localhost; do sleep 1; done"');

// --- Database Commands ---
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
    runDocker("pipenv run python -m backend.manage seed-db", { FLASK_ENV: "development" });
  }
};

const dbReset = () => {
  if (MODE === "LOCAL") {
    runLocal("python backend/manage.py reset-db", { FLASK_ENV: "development" });
  } else {
    ensureDockerUp();
    waitForDb();
    runDocker("pipenv run python backend/manage.py reset-db", { FLASK_ENV: "development" });
  }
};

// --- Backend Quality Commands ---
const runLintBackend = () => {
  if (MODE === "LOCAL") {
    runLocal("flake8 --config=.flake8 backend/app backend/tests");
  } else {
    ensureDockerUp();
    runDocker("pipenv run flake8 --config=/app/backend/.flake8 backend/app backend/tests");
  }
};

const runFormatBackend = () => {
  if (MODE === "LOCAL") {
    runLocal("black backend/app backend/tests");
  } else {
    ensureDockerUp();
    runDocker("pipenv run black backend/app backend/tests");
  }
};

// --- Frontend Quality Commands ---
const runLintFrontend = () => {
  run("npm --prefix frontend run lint");
};

const runFormatFrontend = () => {
  run("npm --prefix frontend run format");
};

// --- Combined Commands ---
const runLintAll = () => {
  log("🔍 Linting backend and frontend...");
  runLintBackend();
  runLintFrontend();
};

const runFormatAll = () => {
  log("🧹 Formatting backend and frontend...");
  runFormatBackend();
  runFormatFrontend();
};

// --- Tests ---
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
    dbUpgrade();
    runDocker(`pipenv run pytest -q --disable-warnings backend/tests ${passthrough.join(" ")}`, {
      FLASK_ENV: "test",
    });
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
    case "lint":
      runLintAll();
      break;
    case "lint:backend":
      runLintBackend();
      break;
    case "lint:frontend":
      runLintFrontend();
      break;
    case "format":
      runFormatAll();
      break;
    case "format:backend":
      runFormatBackend();
      break;
    case "format:frontend":
      runFormatFrontend();
      break;
    default:
      console.log(
        [
          "❓ Unknown command.",
          "Available:",
          "  test | backend",
          "  db:init | db:migrate [msg] | db:upgrade | db:seed | db:reset",
          "  lint | lint:backend | lint:frontend",
          "  format | format:backend | format:frontend",
          "",
          "Tips:",
          "  - RUN_MODE=local or RUN_MODE=docker to force behavior",
          "  - Example: `node backend/scripts/run-helper.js lint`",
        ].join("\n")
      );
      process.exit(2);
  }
} catch (err) {
  console.error("❌ Unexpected error:", err?.message || err);
  process.exit(1);
}
