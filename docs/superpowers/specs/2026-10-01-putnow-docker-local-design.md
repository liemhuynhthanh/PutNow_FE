# PutNow Local Docker Design

Date: 2026-10-01
Status: Implemented and verified locally

> **Superseded database decision:** Flyway references below describe the original Docker implementation. The active local stack now creates and updates the development schema from Hibernate entities as defined in `2026-10-01-putnow-hibernate-local-schema-design.md`.

> **Superseded API-version decision:** Active frontend and backend traffic uses `/api/v1`; see `2026-10-01-putnow-direct-api-v1-design.md`.

## Purpose

Provide a reproducible, production-like local Docker environment for the PutNow frontend and backend repositories. The environment must start the complete application stack under one Compose project, preserve PostgreSQL data, support local email testing, and allow the existing Flyway and Testcontainers checks to run against Docker Desktop.

## Scope

The local stack contains four services:

- `frontend`: Next.js App Router application from `frontend`.
- `backend`: Spring Boot API from `Booking_System`.
- `postgres`: PostgreSQL database managed by a named volume.
- `mailpit`: local SMTP receiver and browser-based mailbox.

Cloudinary remains an external service. A production orchestrator, TLS termination, cloud secrets management, Redis, and production SMTP are outside this local-only design.

## Repository Layout

The two applications remain independent Git repositories. Local orchestration lives in their shared parent directory:

```text
Booking Platform/
├── compose.yaml
├── .env
├── .env.example
├── Booking_System/
│   ├── Dockerfile
│   └── .dockerignore
└── frontend/
    ├── Dockerfile
    └── .dockerignore
```

The root `.env` is local-only and must not be committed. The root `.env.example` documents every required value without containing usable credentials.

## Compose Identity and Ports

The Compose model declares `name: putnow`. Docker therefore creates resources with the `putnow` project prefix instead of relying on the parent folder name.

| Service | Host endpoint | Container endpoint |
| --- | --- | --- |
| Frontend | `http://localhost:5000` | `frontend:5000` |
| Backend | `http://localhost:8080` | `backend:8080` |
| PostgreSQL | `localhost:6000` | `postgres:5432` |
| Mailpit SMTP | `localhost:1025` | `mailpit:1025` |
| Mailpit UI | `http://localhost:8025` | `mailpit:8025` |

Default Compose container names follow the generated form `putnow-<service>-1`. Explicit `container_name` values are avoided because they prevent scaling and cause unnecessary name conflicts.

## Application Data Flow

Browser-side frontend requests use `http://localhost:8080/api/v2`. Server Components execute inside the frontend container and use `http://backend:8080/api/v2` through Docker service discovery.

Spring Boot uses:

- `jdbc:postgresql://postgres:5432/putnow` for PostgreSQL;
- `mailpit:1025` for SMTP;
- `http://localhost:5000` as the allowed credentialed CORS origin and password-reset base URL;
- `COOKIE_SECURE=false` and `COOKIE_SAME_SITE=Lax` for HTTP local development.

The browser remains responsible for cookie storage. Frontend and backend use different ports but the same `localhost` site, while Spring Security explicitly allows the frontend origin with credentials.

## Images

### Frontend

The frontend uses a multi-stage Node image:

1. Install the pinned pnpm version from `packageManager` using Corepack.
2. Install dependencies with `pnpm install --frozen-lockfile`.
3. Build Next.js with `output: "standalone"`.
4. Copy only the standalone server, static assets, and public files into the runtime stage.
5. Run as an unprivileged user and listen on port `5000` on all interfaces.

`NEXT_PUBLIC_API_BASE_URL` is supplied at build time because Next.js embeds public environment values into browser bundles. `API_BASE_URL` is supplied at runtime for Server Components.

### Backend

The backend uses a multi-stage Java image:

1. Resolve Maven dependencies in a builder stage.
2. Build the executable Spring Boot JAR without running tests during image construction.
3. Copy only the JAR into a JRE runtime stage.
4. Run as an unprivileged user on port `8080`.

Tests remain a separate verification step so image builds are deterministic and do not require nested Docker access.

## Networks and Storage

Two Compose networks limit service reachability:

- `putnow-web`: frontend and backend communication.
- `putnow-data`: backend, PostgreSQL, and Mailpit communication.

PostgreSQL is not attached to the frontend network. It is still published only on the loopback host port `6000` because the user explicitly selected that port for local database tools and host-side tests. The data network remains a standard bridge network because Docker Desktop does not publish host ports for services attached only to an internal network.

Database files persist in the named volume `putnow-postgres-data`. Normal `docker compose down` preserves the volume. Documentation must clearly mark `docker compose down --volumes` as destructive.

## Configuration and Secrets

Compose reads local values from the root `.env`. Required secrets use Compose required-variable expressions so startup fails with a clear message instead of silently using insecure defaults.

Required local values:

- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET`, Base64-encoded and at least 256 bits after decoding
- Cloudinary credentials when image upload is tested

Non-secret defaults include ports, database name, database username, cookie flags, Mailpit SMTP settings, rate limits, and frontend/backend URLs.

No credential is copied into either image layer. `.dockerignore` excludes `.env*`, Git metadata, dependency directories, build output, test artifacts, and editor files.

## Startup and Health

Services start in dependency order using health conditions:

1. PostgreSQL becomes healthy through `pg_isready`.
2. Mailpit becomes healthy through its HTTP readiness endpoint.
3. Backend starts, runs Flyway migrations, validates the Hibernate schema, and becomes healthy through Spring Boot Actuator.
4. Frontend starts after the backend is healthy and becomes healthy through an application health endpoint.

All application services use restart policies suitable for local development and `no-new-privileges`. Runtime images use non-root users. Capability dropping and read-only filesystems are applied only where they do not break Java/Next.js runtime requirements.

## Developer Commands

The documented local workflow is:

```powershell
Copy-Item .env.example .env
docker compose config --quiet
docker compose up --build --detach
docker compose ps
docker compose logs --follow backend frontend
docker compose down
```

The project name is already declared in `compose.yaml`, so `-p putnow` is not required. It may still be supplied explicitly without changing the result.

## Failure Handling

- Missing secrets: Compose interpolation stops before containers start.
- PostgreSQL unavailable: backend remains unhealthy and frontend does not start as healthy.
- Flyway failure: backend exits without serving traffic; migration logs remain available through Compose.
- Backend unavailable: frontend health check fails instead of reporting the full stack healthy.
- Cloudinary credentials absent: browsing remains available, while upload operations return the backend's configuration error.
- Mailpit unavailable: backend health remains independent, but password-recovery delivery fails visibly in API/log output.

## Verification

Implementation is accepted only after all applicable checks pass:

1. `docker compose config --quiet` validates the Compose model.
2. Both application images build successfully.
3. All four services report healthy.
4. `http://localhost:5000`, backend Actuator health, and Mailpit UI respond.
5. Flyway creates and validates the PostgreSQL schema in the named volume.
6. Backend tests run with Docker Desktop available, including the PostgreSQL Testcontainers migration test that was previously skipped.
7. Frontend lint, typecheck, unit tests, production build, and Playwright tests remain green.
8. `docker compose down` stops the stack without deleting `putnow-postgres-data`.

## Review Constraints

- All changes remain uncommitted until the user completes review.
- Existing unrelated working-tree changes are preserved.
- No production deployment configuration is introduced in this local Docker increment.
