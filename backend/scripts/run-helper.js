// backend/scripts/run-helper.js
// Purpose: Smartly run tests and DB commands using Docker if the compose stack is up,
// otherwise fall back to local (Pipenv). Works from project root.

const { execSync } = require("child_process");

const [, , subcommand] = process.argv;

const sh = (cmd, opts = {}) => {
  console.log(`🏃 ${cmd}`);
  execSync(cmd, { stdio: "inherit", shell: true, ...opts });
};

const dockerUp = () => {
  try {
    const out = execSync("docker compose ps -q db", { stdio: ["ignore", "pipe", "ignore"], shell: true })
      .toString()
      .trim();
    return out.length > 0;
  } catch {
    return false;
  }
};

// Prefer explicit env flags, else auto-detect based on compose stack being up
const usingDocker =
  process.env.DOCKER_ENV === "true" ||
  process.env.CONTAINER === "docker" ||
  dockerUp();

// ---- Commands (docker vs local) ----
const docker = {
  pytest: `docker compose run --rm -e FLASK_ENV=test -e TEST_DATABASE_URL=postgresql://postgres:postgres@db:5432/heroleague_test -w /app backend pytest -q --disable-warnings backend/tests`,
  dbInit: `docker compose run --rm backend flask --app backend/manage.py db init`,
  dbMigrate: `docker compose run --rm backend flask --app backend/manage.py db migrate -m "Auto migration"`,
  dbUpgrade: `docker compose run --rm backend flask --app backend/manage.py db upgrade`,
  dbSeed: `docker compose run --rm backend python backend/manage.py seed-db`,
  dbReset: `docker compose run --rm backend python backend/manage.py reset-db`,
};

const local = {
  pytest: `pipenv run pytest -q --disable-warnings backend/tests`,
  dbInit: `pipenv run flask --app backend/manage.py db init`,
  dbMigrate: `pipenv run flask --app backend/manage.py db migrate -m "Auto migration"`,
  dbUpgrade: `pipenv run flask --app backend/manage.py db upgrade`,
  dbSeed: `pipenv run python backend/manage.py seed-db`,
  dbReset: `pipenv run python backend/manage.py reset-db`,
};

const cmd = usingDocker ? docker : local;

try {
  switch (subcommand) {
    case "test":
      // Run backend tests (auto docker/local), then frontend tests
      sh(cmd.pytest);
      sh("npm --prefix frontend run test");
      break;

    case "backend":
      sh(cmd.pytest);
      break;

    case "db:init":
      sh(cmd.dbInit);
      break;

    case "db:migrate":
      sh(cmd.dbMigrate);
      break;

    case "db:upgrade":
      sh(cmd.dbUpgrade);
      break;

    case "db:seed":
      sh(cmd.dbSeed);
      break;

    case "db:reset":
      sh(cmd.dbReset);
      break;

    default:
      console.log(
        "❓ Unknown command.\n" +
          "Usage: node backend/scripts/run-helper.js <command>\n" +
          "Commands: test | backend | db:init | db:migrate | db:upgrade | db:seed | db:reset"
      );
      process.exit(2);
  }
} catch (e) {
  console.error("❌ Command failed.");
  process.exit(e.status || 1);
}
