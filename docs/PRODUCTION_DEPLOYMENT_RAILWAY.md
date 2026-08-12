# IUVFES production deployment — Railway

## Architecture

GitHub Pages serves the static UI. Railway runs the Node/Express/tRPC server and a MySQL service stores the IUVFES application data.

```text
GitHub Pages
  https://goomevision.github.io/IUVFESDigitalTwin/
          |
          | HTTPS /api/trpc
          v
Railway: IUVFES API
          |
          | DATABASE_URL
          v
Railway: MySQL
          |
          v
experiments / materials / closedLoopSessions / evidence-related tables
```

## 1. Create Railway project

Use Railway's GitHub deployment flow and select `goomevision/IUVFESDigitalTwin`.

Deploy from branch:

`feature/control-room-ui`

The repository contains `Dockerfile` and `railway.json`.

## 2. Add MySQL

Inside the same Railway project, add a MySQL database service.

Railway exposes `MYSQL_URL` and related connection variables on the MySQL service.

On the IUVFES API service, set:

`DATABASE_URL=${{MySQL.MYSQL_URL}}`

If the database service receives a different name, use that service name in the Railway reference expression.

## 3. Required API variables

Set these on the IUVFES API service:

- `NODE_ENV=production`
- `DATABASE_URL=${{MySQL.MYSQL_URL}}`
- `JWT_SECRET=<generate a long random secret>`
- `IUVFES_WEB_ORIGINS=https://goomevision.github.io`
- `VITE_APP_ID=<existing application ID if OAuth is used>`
- `OAUTH_SERVER_URL=<existing OAuth server URL if OAuth is used>`
- `OWNER_OPEN_ID=<existing owner OpenID if admin ownership is used>`

Do not commit any secret values to Git.

## 4. Database schema

After MySQL is provisioned, run the repository database migration command in the Railway service environment:

`pnpm db:push`

Do this only against the intended production database. Review the generated migration/schema changes before applying them.

## 5. Health check

The API exposes:

`GET /health`

Expected response includes:

```json
{
  "ok": true,
  "service": "IUVFESDigitalTwin",
  "databaseConfigured": true,
  "environment": "production"
}
```

Configure Railway health check path as `/health` (already present in `railway.json`).

## 6. Generate public API domain

In Railway, generate a public domain for the IUVFES API service.

Example shape only — do not use this as the real URL:

`https://<actual-iuvfes-api>.up.railway.app`

Verify:

`https://<actual-iuvfes-api>.up.railway.app/health`

## 7. Connect GitHub Pages to the API

In GitHub repository settings, add an Actions secret:

`IUVFES_API_URL`

Value:

`https://<actual-iuvfes-api>.up.railway.app`

Do not include `/api/trpc`; the frontend appends that path itself.

The Pages workflow already reads this secret as `VITE_IUVFES_API_URL`.

Push/dispatch the Pages workflow after the secret is present. The resulting frontend will call:

`https://<actual-iuvfes-api>.up.railway.app/api/trpc`

## 8. Verify the scientific loop

1. Open the GitHub Pages UI.
2. Confirm `materials.list` returns actual database rows. Empty database must remain empty; do not seed invented scientific values.
3. Create an experiment through `experiments.create`.
4. Confirm a real UUID `experimentId` is returned.
5. Navigate to the experiment route.
6. Confirm the Control Room loads using that ID.
7. Confirm ProcessMachine3D receives state from the actual CausalFrame/session contract.
8. Confirm unavailable values remain `UNKNOWN`/`UNVERIFIED` rather than synthetic telemetry.

## Security boundary

Never put `DATABASE_URL`, `JWT_SECRET`, OAuth secrets, or database passwords into the repository or GitHub Pages bundle.

GitHub Pages is public static hosting. Only the API public URL belongs in the frontend build; secrets remain on Railway/GitHub Actions secrets.
