# P29 — External Runtime Deployment Specification

**Purpose:** A minimal operator-facing specification to deploy the complete IUVFES backend without modifying the scientific source.

**Required source:** `goomevision/IUVFESDigitalTwin`
**Branch:** `feature/control-room-ui`
**Required Git SHA:** `032e1ff08c69e2f1b907ed2eab4c4faecd782c17`

> This document is a deployment specification only. It does not authorize a deployment, migration, OAuth login, experiment/session creation, telemetry, synthetic data, P10 execution, or 3D runtime testing.

## Minimum Infrastructure

| Requirement | Minimum operator provision |
|---|---|
| Source access | A Git-capable build worker with read access to `goomevision/IUVFESDigitalTwin`. |
| Compute | One Linux container, VM, or managed Node service capable of running Node.js and a long-lived Express process. |
| Runtime | Node.js `22.13.0` compatible runtime and pnpm `10.4.1` compatible with the committed lockfile. |
| Build storage | Ephemeral build workspace for source checkout, dependency installation, and `dist/` artifact. |
| Database | A managed MySQL/TiDB-compatible database reachable only from the backend over TLS. |
| Secret manager | Managed deployment environment variables; never commit values, inject them into frontend code, or write them to build logs. |
| HTTPS ingress | A public TLS terminator/reverse proxy or managed HTTPS service routing to the Node backend. |
| Release registry | Deployment-system metadata that records immutable artifact, Git SHA, build time, frontend identity, and backend identity. |

## Deployment Steps

### 1. Source Checkout

1. Clone the repository into a clean build workspace.
2. Fetch `feature/control-room-ui`.
3. Check out **exactly** `032e1ff08c69e2f1b907ed2eab4c4faecd782c17` in detached-HEAD mode or via an immutable release tag that resolves to this SHA.
4. Fail the pipeline if `git rev-parse HEAD` does not equal the required SHA.
5. Verify the checkout contains `package.json`, `pnpm-lock.yaml`, `client/`, `server/`, and `drizzle/`, including `closedLoopRouter`, `closedLoopSimulation`, `closedLoopSessionStore`, `closedLoopRuntimeStore`, `scientificEventJournal`, and `scientificDatasetPersistence`.

### 2. Build Commands

Run these commands from the repository root in the build environment:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

The operator must fail the release if the type check, test suite, or build fails. `pnpm build` creates the frontend output and bundles `server/_core/index.ts` to `dist/index.js`.

### 3. Start Command

Start the complete backend with:

```bash
NODE_ENV=production pnpm start
```

The command runs `node dist/index.js`. The deployment platform must assign the listening port through its runtime environment; no source edit or hard-coded port is permitted.

## Required Secrets and Environment Categories

The operator must provide values only through the platform secret manager. The following categories are required; secret values must never appear in source, frontend bundles, screenshots, documentation, or logs.

| Category | Required purpose |
|---|---|
| Database connection | TLS-enabled MySQL/TiDB-compatible connection string for the complete backend. |
| Session signing | Strong backend session/JWT signing secret. |
| OAuth provider/application | OAuth server endpoint, application identity, and approved backend callback configuration. |
| Frontend/API origin | Authoritative public frontend origin and API base URL. |
| CORS and return-target allowlist | Explicit approved frontend origins, including the GitHub Pages origin if it remains the frontend host. |
| Storage / scientific dataset services | Approved server-side storage configuration only if those source features are enabled. |
| Deployment identity metadata | Build-system-generated Git SHA, artifact identifier, build time, and environment identifier. |
| Observability | Non-scientific operational logging/monitoring configuration. |

## Database Requirements

The backend must use an approved, isolated production database connection. The database schema must be compatible with the canonical migration chain:

```text
0000_youthful_daredevil
  → 0001_purple_ozymandias
  → 0002_known_wolfpack
  → 0003_open_peter_quill
```

Migration is a separate, explicitly approved operation. It **must not** run automatically during application build, start, health check, or P10 acceptance. Before any migration, the database owner must provide verified backup, restore, PITR, migration ownership, and recovery/rollback procedures.

## Public HTTPS API Requirements

The external deployment must expose the full backend at a stable HTTPS API host. It must route these source-owned paths to the same backend release:

| Path / capability | Requirement |
|---|---|
| `/health` | Public or operator-restricted health response proving the expected backend process is running. |
| `/api/trpc` | Credentialed tRPC API served by the complete `appRouter`, including closed-loop routes. |
| `/api/oauth/login` | Backend-owned OAuth entry point. |
| `/api/oauth/callback` | Backend-owned OAuth callback registered with the provider. |
| CORS | Exact allowed frontend origin plus credentials; no wildcard origin with credentialed cookies. |
| Cookie boundary | Secure backend-hosted session and nonce cookies; no frontend-only authentication fallback. |

## Immutable Release Identity

The deployment system—not application code—must generate immutable release metadata that links all of the following:

1. Git SHA `032e1ff08c69e2f1b907ed2eab4c4faecd782c17`;
2. build artifact/image digest;
3. backend/API service revision;
4. frontend asset revision; and
5. deployment timestamp and environment.

The operator must be able to inspect this metadata in the deployment system or signed artifact registry. A manually added HTTP header, frontend label, local file, or manually typed `X-Commit-SHA` is not acceptable release identity.

## Health Endpoint and Operator Check

After deployment, perform only these non-mutating checks before any authenticated acceptance:

1. Confirm deployment-system release identity maps both frontend and backend to the required SHA.
2. Request `GET /health` from the intended API host and confirm the response comes from the identified backend revision.
3. Confirm the OAuth callback and approved return-target configuration reference the same API/frontend release.
4. Confirm credentialed CORS preflight behavior from the intended frontend origin.

Stop if any of these checks fails. Do not proceed to login, `auth.me`, experiment lookup, canonical-session lookup, lifecycle, replay, 3D, or WebGL acceptance.

## Rollback Method

| Failure domain | Minimum rollback method |
|---|---|
| Application/backend release | Redeploy the previous immutable frontend and backend artifacts together, preserving their recorded release identities. |
| OAuth/CORS configuration | Restore the last approved deployment configuration; do not weaken callback, nonce, cookie, or return-target protections. |
| Database migration / data issue | Use the database owner’s approved backup/PITR/recovery procedure. Application rollback alone does not roll back schema or data. |

## First Post-Deploy Read-Only Checks

When the external operator completes the requirements above, repeat the P27/P25 gates in order:

```text
release identity
  → health
  → callback and CORS
  → legitimate operator authentication
  → existing experiment
  → existing canonical ClosedLoop session
  → read-only closed-loop/replay verification
  → ProcessSimulator
  → ProcessMachine3D / WebGL acceptance
```

No new experiment, session, telemetry, scientific data, laboratory evidence, synthetic data, or authentication bypass is allowed in this sequence.

## Final Blocker

**External deployment configuration is required.** The current Manus Web App is an S3-backed legacy project and cannot deploy this complete GitHub backend, provide a matching public API, or create immutable release identity for the required source SHA.

## References

[1]: ./P26_DEPLOYMENT_READINESS_SPECIFICATION.md "Deployment readiness prerequisites"
[2]: ./P27_RUNTIME_ACCEPTANCE_GATE.md "Runtime acceptance gate and deployment-identity stop condition"
[3]: ./P25_RUNTIME_INTEGRATION_PREFLIGHT.md "Full backend source and runtime preflight"
[4]: ../package.json "Build and start scripts"
