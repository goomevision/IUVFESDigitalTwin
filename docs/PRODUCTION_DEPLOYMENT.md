# IUVFES Digital Twin — production deployment

## Current architecture

IUVFES is a Node.js/Express + tRPC application. `server/_core/index.ts` serves the built React application and `/api/trpc` from the same process. The production command is `pnpm start` after `pnpm build`.

GitHub Pages is static hosting only. It is suitable for the frontend artifact, but it cannot host the Express/tRPC runtime, the closed-loop session store, or the database connection.

## Recommended deployment shape

```text
Browser
  |
  +--> GitHub Pages (static UI) -- optional
  |
  +--> IUVFES Node service (recommended production origin)
           |
           +--> Express + tRPC
           +--> ClosedLoopRuntimeStore
           +--> MySQL via DATABASE_URL
           +--> raw dataset storage
           +--> OAuth provider
```

For the first production milestone, deploying the complete application (UI + API) as one Node service is preferred. This avoids cross-origin cookie/CORS complexity and makes the Control Room available from one URL.

## Why Laravel Cloud is not the direct runtime for the current repository

Laravel Cloud is designed for Laravel applications. This repository currently runs a Node.js/Express server, so it should not be deployed to Laravel Cloud unchanged. Do not rewrite the scientific engine into Laravel merely to fit the hosting provider.

Use a Node/Docker-capable host for the current application. If Laravel Cloud is required later for a separate Laravel API/database service, keep that service behind an explicit contract and do not move the simulation engine implicitly.

## Container

The repository now contains `Dockerfile` with a reproducible build:

```text
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm start
```

The runtime listens on `PORT` (default 3000).

## Required environment variables

At minimum, production requires the database and session/auth configuration already used by the application:

```text
NODE_ENV=production
PORT=3000
DATABASE_URL=<production MySQL URL>
JWT_SECRET=<long random secret>
VITE_APP_ID=<OAuth application id>
OAUTH_SERVER_URL=<configured OAuth server>
OWNER_OPEN_ID=<owner OpenID>
```

If the deployment uses the existing storage integrations, also configure their existing variables rather than inventing replacements.

## Database

Run the existing Drizzle migration workflow against the production database. Do not seed scientific values into production merely to make the Material selector non-empty. Material records must come from an authoritative catalog or explicitly entered operator/admin data.

## GitHub Pages frontend mode

The frontend now supports:

```text
VITE_IUVFES_API_URL=https://<backend-host>
```

When this variable is present, tRPC calls are sent to:

```text
https://<backend-host>/api/trpc
```

When absent, the UI uses the same-origin `/api/trpc` path, which is the preferred production configuration when the complete Node application is deployed together.

## Scientific boundary

No demo experiment ID, fake telemetry, fake material measurement, or synthetic laboratory result may be inserted to make deployment appear successful.

A successful deployment means:

1. `/` loads the intake UI.
2. `materials.list` reads the actual database.
3. `experiments.create` creates an actual persisted experiment for an authenticated operator.
4. The resulting experiment ID enters `ProcessSimulator`.
5. `closedLoop` state comes from the authoritative simulation session/CausalFrame.
6. Simulation evidence remains explicitly `SIMULATION`; laboratory evidence remains separate.
7. Missing data remains `UNKNOWN` rather than zero or a fabricated fallback.
