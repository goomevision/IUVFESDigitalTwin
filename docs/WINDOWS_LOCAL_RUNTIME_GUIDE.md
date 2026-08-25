# Windows Local Runtime Guide

This is a **developer handoff guide**. Run commands only on a developer-owned Windows machine and only against an isolated local database. Do not use a production `DATABASE_URL`, production OAuth, production migration, production database, or P10 runtime acceptance.

**Application source baseline:** `feature/control-room-ui` at `032e1ff08c69e2f1b907ed2eab4c4faecd782c17`
**Current published documentation baseline:** `39b4c42c81e99cfeba4a1adbf2140825d10ce5b3`

> The least-weight option is an **already installed MySQL or MariaDB Windows service**. If no local service is available, stop at the prerequisite check. Do not substitute a production connection and do not run a database download or installation as part of this guide.

## Prerequisite

Open **PowerShell** and run these checks. They inspect availability only.

```powershell
node --version
corepack --version
Get-Command mysql -ErrorAction SilentlyContinue
Get-Command docker -ErrorAction SilentlyContinue
Get-Command wsl -ErrorAction SilentlyContinue
Get-Service -Name MySQL*,MariaDB* -ErrorAction SilentlyContinue
```

Use the following selection order.

| Local capability already present | Developer choice |
|---|---|
| MySQL/MariaDB Windows service is running | **Preferred:** use that service with a new isolated `iuvfes_local` database and `iuvfes_dev` user. |
| Docker Desktop is already installed and running | Optional alternative; use an isolated local container only under the developer’s normal Docker policy. |
| WSL is already installed and has MySQL/MariaDB already running | Use its local listener only if it is explicitly reachable at `127.0.0.1` and has a new isolated database. |
| None of the above | Stop. Local database runtime is not ready; do not use production. |

Install Node.js 22 and pnpm from the project lockfile’s required toolchain only through the developer’s approved local setup process. This guide does not run installations.

## Exact Windows Commands

### 1. Clone and check out the source

```powershell
git clone https://github.com/goomevision/IUVFESDigitalTwin.git
Set-Location IUVFESDigitalTwin
git fetch origin feature/control-room-ui
git checkout feature/control-room-ui
git rev-parse HEAD
```

For the application baseline, the final command must resolve to:

```text
032e1ff08c69e2f1b907ed2eab4c4faecd782c17
```

### 2. Install locked JavaScript dependencies

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

### 3. Create an isolated local development database

Run this only when `mysql` connects to an already-running **local** MySQL/MariaDB service.

```powershell
mysql -h 127.0.0.1 -P 3306 -u root -p -e "CREATE DATABASE iuvfes_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER 'iuvfes_dev'@'localhost' IDENTIFIED BY 'REPLACE_WITH_LOCAL_PASSWORD'; GRANT ALL PRIVILEGES ON iuvfes_local.* TO 'iuvfes_dev'@'localhost'; FLUSH PRIVILEGES;"
```

Replace only `REPLACE_WITH_LOCAL_PASSWORD` with a developer-local password. Never reuse a production password.

## Environment Variables

Set variables only in the current PowerShell session; do not commit them to source.

```powershell
$env:NODE_ENV = "development"
$env:DATABASE_URL = "mysql://iuvfes_dev:REPLACE_WITH_URL_ENCODED_LOCAL_PASSWORD@127.0.0.1:3306/iuvfes_local"
$env:JWT_SECRET = "REPLACE_WITH_LOCAL_DEVELOPMENT_SECRET"
$env:VITE_APP_ID = "REPLACE_WITH_LOCAL_OAUTH_APP_ID"
$env:OAUTH_SERVER_URL = "REPLACE_WITH_LOCAL_OR_APPROVED_DEV_OAUTH_SERVER"
$env:VITE_OAUTH_PORTAL_URL = "REPLACE_WITH_LOCAL_OR_APPROVED_DEV_OAUTH_PORTAL"
```

Before any migration or startup, confirm that the target is local and does not point to production:

```powershell
if ($env:DATABASE_URL -match '@(127\.0\.0\.1|localhost):') { "LOCAL DATABASE TARGET CONFIRMED" } else { throw "STOP: DATABASE_URL is not localhost" }
```

Do not print the full `DATABASE_URL` or any secret value.

## Canonical Migration

The only accepted migration order is:

```text
0000_youthful_daredevil.sql
  → 0001_purple_ozymandias.sql
  → 0002_known_wolfpack.sql
  → 0003_open_peter_quill.sql
```

After the local-target assertion succeeds, review the local migration files and apply existing migrations:

```powershell
Get-ChildItem drizzle\000*.sql
pnpm drizzle-kit migrate
```

Do **not** run `pnpm db:push` for this rehearsal: that project script generates migrations before migrating and can create unreviewed source changes. Do not run `scientific-data.sql` as a substitute for the canonical chain.

## Startup Commands

The development command starts the local Express/Vite development server from `server/_core/index.ts`:

```powershell
pnpm dev
```

For a production-like local process, use a second PowerShell session only after the build succeeds:

```powershell
pnpm build
$env:NODE_ENV = "production"
pnpm start
```

The project does not require a second separate frontend command in development; the backend entry point integrates the Vite development path. Do not run both development and production commands on the same port.

## Verification Checklist

Perform only these local, non-scientific checks.

| Check | Windows command / action | Expected result |
|---|---|---|
| Health | `Invoke-RestMethod http://localhost:3000/health` | HTTP 200 and IUVFES service health response. |
| Closed-loop load | `pnpm test -- server/closedLoopRouter.access.test.ts server/closedLoopWiring.test.ts` | Tests pass; no experiment/session is created. |
| Frontend route | Open `http://localhost:3000/experiment` | Control Room route loads. Without a legitimate local auth setup, `NOT AUTHENTICATED` is expected. |
| ProcessSimulator | Do not bypass auth or create an experiment. | The component is source-present but not mounted until legitimate auth and an existing experiment are available. |
| ProcessMachine3D | Do not fabricate an experiment/session for this check. | The component is source-present but remains untested until the permitted mount prerequisites exist. |
| Static 3D boundary | `pnpm test -- client/src/components/ProcessMachine3D.test.tsx server/processMachine3D.p15.test.ts` | Tests confirm source-level mapping/cleanup boundaries without WebGL acceptance. |

Do not perform OAuth production login, create an experiment, create a canonical session, execute lifecycle commands, produce telemetry, or present a local simulation as laboratory data.

## Cleanup and Local Rollback

Stop the local process with `Ctrl+C`, then clear current-session variables:

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:JWT_SECRET -ErrorAction SilentlyContinue
Remove-Item Env:VITE_APP_ID -ErrorAction SilentlyContinue
Remove-Item Env:OAUTH_SERVER_URL -ErrorAction SilentlyContinue
Remove-Item Env:VITE_OAUTH_PORTAL_URL -ErrorAction SilentlyContinue
```

If—and only if—the database was created solely for this local guide, remove the isolated local database and user from the same local host:

```powershell
mysql -h 127.0.0.1 -P 3306 -u root -p -e "DROP DATABASE IF EXISTS iuvfes_local; DROP USER IF EXISTS 'iuvfes_dev'@'localhost'; FLUSH PRIVILEGES;"
```

Never run the cleanup command against production or any host other than `127.0.0.1`.

## References

[1]: ./P29_EXTERNAL_RUNTIME_DEPLOYMENT_SPECIFICATION.md "External runtime deployment specification"
[2]: ./P26_DEPLOYMENT_READINESS_SPECIFICATION.md "Canonical migration, runtime, identity, and health requirements"
[3]: ../package.json "Development, build, start, test, and migration scripts"
[4]: ../drizzle/meta/_journal.json "Canonical Drizzle migration journal"
