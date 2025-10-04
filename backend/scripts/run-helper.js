// File: backend/scripts/run-helper.js
// Purpose: Automatically choose between Docker or local (Pipenv) for tests and DB commands.

import { execSync } from "child_process";
import path from "path";

const args = process.argv.slice(2);
const command = args[0];

// Detect Docker context
const usingDocker =
  process.env.DOCKER_ENV === "true" || process.env.CONTAINER === "docker";

const baseDocker = "docker compose run --rm -w /app backend";
const baseLocal = "pipenv run";
const rootPath = path.resolve(".");

const run = (cmd) => {
  console.log(`🏃 Running: ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: rootPath });
};

try {
  switch (command) {
    case "backend":
      run(
        usingDocker
          ? `${baseDocker} pytest -q --disable-warnings backend/tests`
          : `${baseLocal} pytest -q --disable-warnings backend/tests`
      );
      break;

    case "db:init":
      run(`${baseDocker} flask --app backend/manage.py db init`);
      break;
    case "db:migrate":
      run(`${baseDocker} flask --app backend/manage.py db migrate -m "Auto migration"`);
      break;
    case "db:upgrade":
      run(`${baseDocker} flask --app backend/manage.py db upgrade`);
      break;
    case "db:seed":
      run(`${baseDocker} python backend/manage.py seed-db`);
      break;
    case "db:reset":
      run(`${baseDocker} python backend/manage.py reset-db`);
      break;

    default:
      console.log(
        "❓ Unknown command. Try: backend | db:init | db:migrate | db:upgrade | db:seed | db:reset"
      );
  }
} catch (err) {
  console.error("❌ Command failed:", err.message);
  process.exit(1);
}
