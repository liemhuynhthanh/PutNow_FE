# PutNow Local Docker Implementation Plan

> **Superseded database tasks:** Flyway verification in this historical plan is replaced by the Hibernate-managed local schema plan dated 2026-10-01.

> **Superseded API-version tasks:** Active Docker API URLs use `/api/v1`; see `2026-10-01-putnow-direct-api-v1-implementation-plan.md`.

Date: 2026-10-01
Design: `../specs/2026-10-01-putnow-docker-local-design.md`
Status: Implemented and verified locally

## Objective

Create a production-like local Docker stack named `putnow` for the existing Next.js frontend, Spring Boot backend, PostgreSQL database, and Mailpit SMTP service. Preserve the two repositories as independent projects, keep secrets out of Git and image layers, and verify Flyway/Testcontainers against Docker Desktop.

All work remains uncommitted for user review.

## Task 1: Establish Root Orchestration Configuration

**Create:**

- `D:\Booking Platform\compose.yaml`
- `D:\Booking Platform\.env.example`
- `D:\Booking Platform\.gitignore`

**Steps:**

1. Add `name: putnow` to the Compose model.
2. Define `frontend`, `backend`, `postgres`, and `mailpit` services without explicit `container_name` values.
3. Define separate `putnow-web` and `putnow-data` bridge networks; bind all published ports to `127.0.0.1`.
4. Define the persistent `putnow-postgres-data` volume.
5. Publish only the approved local ports: frontend `5000`, backend `8080`, PostgreSQL `6000`, Mailpit SMTP `1025`, and Mailpit UI `8025`.
6. Use required-variable interpolation for `POSTGRES_PASSWORD` and `JWT_ACCESS_SECRET`.
7. Put non-secret development defaults and documented Cloudinary placeholders in `.env.example`.
8. Ignore `.env` and local Compose override files while retaining `.env.example`.
9. Validate the model with `docker compose config --quiet` before building.

## Task 2: Harden the Spring Boot Image

**Modify:**

- `D:\Booking Platform\Booking_System\Dockerfile`

**Create:**

- `D:\Booking Platform\Booking_System\.dockerignore`

**Steps:**

1. Replace the single-stage image with a multi-stage Maven/JRE build using explicit, validated image versions.
2. Copy `pom.xml` separately and resolve dependencies before copying source to improve layer reuse.
3. Build the executable JAR with tests skipped only inside the image build; tests remain a separate verification gate.
4. Create a numeric unprivileged runtime user and copy only the built JAR into the runtime stage.
5. Add JVM container defaults and expose port `8080`.
6. Add an Actuator-based health check using a tool available in the selected runtime image.
7. Exclude Git data, IDE files, target output, local environment files, logs, and documentation from the build context.
8. Build the image independently before integrating it into Compose.

## Task 3: Produce a Standalone Next.js Image

**Modify:**

- `D:\Booking Platform\frontend\next.config.ts`
- `D:\Booking Platform\frontend\.gitignore`

**Create:**

- `D:\Booking Platform\frontend\Dockerfile`
- `D:\Booking Platform\frontend\.dockerignore`
- `D:\Booking Platform\frontend\src\app\api\health\route.ts`
- `D:\Booking Platform\frontend\src\app\api\health\route.test.ts`

**Steps:**

1. Add a failing unit test for the frontend health route response.
2. Implement a dependency-free `GET /api/health` response and make the test pass.
3. Enable Next.js `output: "standalone"` after checking the installed Next.js 16 documentation.
4. Create a multi-stage Node image using the `pnpm@11.9.0` version already pinned by `packageManager`.
5. Install dependencies with `pnpm install --frozen-lockfile` and build with the browser API URL supplied as a build argument.
6. Copy only the standalone server, `.next/static`, and `public` into the runtime stage.
7. Run as the image's unprivileged Node user with `HOSTNAME=0.0.0.0` and `PORT=5000`.
8. Add a health check against `/api/health` using Node's built-in `fetch` so no extra runtime package is required.
9. Exclude dependencies, `.next`, test artifacts, local environment files, Git data, logs, and editor files from the build context.
10. Run lint, typecheck, unit tests, and the production build before Compose integration.

## Task 4: Wire Services, Configuration, and Health Dependencies

**Modify:**

- `D:\Booking Platform\compose.yaml`

**Steps:**

1. Configure PostgreSQL with database `putnow`, a dedicated local user, the required password, `pg_isready`, and the named volume.
2. Configure Mailpit with a pinned image and an HTTP readiness check.
3. Configure Spring Boot with:
   - `DATABASE_URL=jdbc:postgresql://postgres:5432/putnow`
   - `SMTP_HOST=mailpit`
   - `SMTP_PORT=1025`
   - `FRONTEND_BASE_URL=http://localhost:5000`
   - local cookie settings
   - JWT, Cloudinary, mail sender, and rate-limit variables from `.env`
4. Make the backend depend on healthy PostgreSQL and Mailpit.
5. Configure the frontend build with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v2`.
6. Configure the frontend runtime with `API_BASE_URL=http://backend:8080/api/v2`.
7. Make the frontend depend on the healthy backend.
8. Add `no-new-privileges`, bounded restart policies, and capability dropping where supported by each image.
9. Render the fully interpolated Compose configuration and inspect it without printing secret values.

## Task 5: Create the Local Secret File Safely

**Create locally, never commit:**

- `D:\Booking Platform\.env`

**Steps:**

1. Copy `.env.example` to `.env` only if `.env` does not already exist.
2. Generate a cryptographically random PostgreSQL password.
3. Generate at least 32 random bytes and encode them as Base64 for `JWT_ACCESS_SECRET`.
4. Preserve any existing user-provided Cloudinary values instead of overwriting them.
5. Confirm `.env` is ignored and do not print its values to logs or the final response.

## Task 6: Build and Start PutNow

**Commands:**

```powershell
docker compose config --quiet
docker compose build
docker compose up --detach
docker compose ps
```

**Steps:**

1. Confirm Docker Desktop is running before build.
2. Validate that all selected base-image tags are resolvable and use reproducible version tags.
3. Build both application images without using host build output.
4. Start the complete stack and wait for health checks.
5. If a service is unhealthy, inspect only that service's bounded log tail and fix the underlying configuration.
6. Verify that Flyway applied the complete schema and Hibernate validation succeeded.

## Task 7: Verify User-Visible and Infrastructure Behavior

**Checks:**

1. Request `http://localhost:5000/api/health` and the frontend home page.
2. Request `http://localhost:8080/actuator/health` and the public concert endpoint.
3. Request `http://localhost:8025` and confirm Mailpit is reachable.
4. Connect to PostgreSQL through host port `6000` without exposing credentials in output.
5. Exercise CSRF-cookie creation from frontend origin `http://localhost:5000` and verify credentialed CORS headers.
6. Trigger a password-recovery request and verify Mailpit receives the message without exposing reset tokens in logs or the final report.
7. Stop and restart the stack, then confirm PostgreSQL data remains in `putnow-postgres-data`.

## Task 8: Run Regression and Migration Gates

**Backend:**

```powershell
mvn.cmd test -q
mvn.cmd package -q -DskipTests
```

**Frontend:**

```powershell
corepack.cmd pnpm lint
corepack.cmd pnpm typecheck
corepack.cmd pnpm test
corepack.cmd pnpm build
corepack.cmd pnpm exec playwright test
```

**Steps:**

1. Confirm the PostgreSQL Testcontainers migration test runs instead of skipping.
2. Require zero backend test failures or errors.
3. Require frontend lint, TypeScript, unit test, build, and E2E success.
4. Run `git diff --check` in both repositories.
5. Scan tracked and untracked source/config files for accidentally embedded credentials.
6. Keep all implementation changes uncommitted and report exact test counts.

## Task 9: Document Local Operations

**Modify:**

- `D:\Booking Platform\frontend\README.md`
- `D:\Booking Platform\Booking_System\Readme.md`

**Create:**

- `D:\Booking Platform\DOCKER.md`

**Steps:**

1. Document initial `.env` creation without including real secret values.
2. Document start, stop, rebuild, health, and bounded log commands.
3. Explain why browser and Server Component backend URLs differ.
4. Document all approved host ports.
5. Mark `docker compose down --volumes` as destructive and exclude it from the normal workflow.
6. Document how to replace Mailpit with a production SMTP provider later without changing application code.
7. State explicitly that this Compose model is for local development, not a production orchestrator.

## Completion Criteria

- Compose resources use the `putnow` project prefix.
- All four services are healthy on the approved ports.
- PostgreSQL data survives a normal stop/start cycle.
- Flyway and Hibernate schema validation complete successfully.
- Testcontainers PostgreSQL verification no longer skips.
- Frontend and backend regression suites pass.
- No usable secret is present in either Git working tree or image definition.
- No commit or push is created.
