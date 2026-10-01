# PutNow Direct API v1 Implementation Plan

**Date:** 2026-10-01  
**Design:** `../specs/2026-10-01-putnow-direct-api-v1-design.md`  
**Status:** Implemented and verified locally  
**Scope:** Coordinated backend/frontend route namespace change from `/api/v2` to `/api/v1`

## Objective

Expose the current hardened PutNow API directly under `/api/v1`, remove version suffixes from controller class names, and update every active consumer and verification artifact. Do not provide a v2 alias, restore the legacy v1 contract, modify the database schema, or reset the PostgreSQL volume.

All work remains uncommitted and unpushed for user review.

## Safety and Compatibility Rules

- Preserve all current DTOs, response shapes, authentication behavior, authorization rules, and business logic.
- Do not add a second route mapping for `/api/v2`.
- Do not restore deleted legacy controllers.
- Do not run `docker compose down --volumes` or remove any volume.
- Preserve unrelated changes in both dirty repositories.
- Treat the namespace change as coordinated and breaking: backend and frontend move together.

## Task 1: Change Backend Contract Tests to API v1

**Modify:**

- `Booking_System/src/test/java/com/huynhliem/SecurityContractTest.java`

**Create if needed:**

- a focused controller/OpenAPI route test under `Booking_System/src/test/java/com/huynhliem`

**Steps:**

1. Change public concert, authenticated booking, login, CORS, CSRF, and role checks from `/api/v2` to `/api/v1`.
2. Add an assertion that Spring MVC registers the expected `/api/v1` controller mappings.
3. Add an assertion that active OpenAPI configuration targets `/api/v1/**`.
4. Run the focused tests before changing controller mappings and confirm they fail for the expected missing v1 routes.

## Task 2: Rename Controllers Without Version Suffixes

**Rename and modify:**

- `auth/api/AuthenticationV2Controller.java` -> `auth/api/AuthenticationController.java`
- `concert/api/ConcertV2Controller.java` -> `concert/api/ConcertController.java`
- `booking/api/BookingV2Controller.java` -> `booking/api/BookingController.java`
- `admin/api/AdminV2Controller.java` -> `admin/api/AdminController.java`

All paths are relative to `Booking_System/src/main/java/com/huynhliem`.

**Steps:**

1. Rename each public Java class and its file together.
2. Change base mappings to `/api/v1/auth`, `/api/v1/concerts`, `/api/v1/bookings`, and `/api/v1` respectively.
3. Keep all endpoint methods, DTOs, validation, cookies, CSRF handling, status codes, pagination, and service calls unchanged.
4. Confirm no active Java class contains `V1Controller` or `V2Controller`.
5. Run the focused backend tests and require them to pass.

## Task 3: Move Security and OpenAPI Configuration to v1

**Modify:**

- `Booking_System/src/main/java/com/huynhliem/config/AppConfig.java`
- `Booking_System/src/main/java/com/huynhliem/config/OpenApiConfig.java`

**Steps:**

1. Replace every `/api/v2` Spring Security matcher with its `/api/v1` equivalent.
2. Preserve the current public, authenticated, administrator, CORS, and CSRF rule ordering.
3. Update OpenAPI description text to reference `GET /api/v1/auth/csrf`.
4. Rename the primary OpenAPI group from `API v2` to `API v1` and match only `/api/v1/**`.
5. Update authentication, concert, booking, and administration group patterns to `/api/v1`.
6. Verify the application context starts without duplicate or ambiguous mappings.

## Task 4: Point Frontend Clients and Mocks to v1

**Modify:**

- `frontend/src/lib/api-client.ts`
- `frontend/src/lib/server-api.ts`
- `frontend/.env.example`
- `frontend/Dockerfile`
- `frontend/playwright.config.ts`
- `frontend/scripts/mock-api.mjs`

**Steps:**

1. Change browser and host-side Server Component defaults to `http://localhost:8080/api/v1`.
2. Change the Docker build default to `/api/v1`.
3. Change Playwright mock-server health probes and injected environment values to `/api/v1`.
4. Make the mock API strip `/api/v1` from incoming request paths.
5. Keep all relative endpoint paths and frontend data contracts unchanged.
6. Run frontend unit tests to confirm API client, session, and form behavior remains unchanged.

## Task 5: Update Shared Docker Runtime Configuration

**Modify:**

- `compose.yaml`
- `DOCKER.md`

**Steps:**

1. Change the frontend build-time browser URL to `http://localhost:8080/api/v1`.
2. Change the frontend runtime server URL to `http://backend:8080/api/v1`.
3. Change the runtime public URL to `http://localhost:8080/api/v1`.
4. Update the Docker data-flow documentation to v1.
5. Run `docker compose config --quiet` without printing secret values.
6. Do not recreate or remove the PostgreSQL volume during configuration validation.

## Task 6: Replace Active API Documentation with v1

**Rename and modify:**

- `Booking_System/docs/api-v2.md` -> `Booking_System/docs/api-v1.md`

**Modify:**

- `Booking_System/README.md`
- `frontend/README.md`
- `Booking_System/BookingSystem_Postman_Collection.json`

**Steps:**

1. Rename the contract title and all active paths from v2 to v1.
2. Update backend README CSRF instructions, API heading, contract link, and migration wording.
3. Update frontend environment examples and references to the active API types.
4. Rebuild the Postman collection around the current v1 contract:
   - current register/login/logout/refresh/me/password-recovery routes;
   - cookie and CSRF behavior for unsafe requests;
   - current concert, booking, user, voucher, and media paths;
   - current pagination and Problem Detail expectations.
5. Remove legacy paths such as `/signup`, `/list`, `/admin/create`, `/history`, and `/ticket-types/concert/{id}` when they do not match active controllers.
6. Validate that the Postman file remains valid JSON.

## Task 7: Mark Earlier v2 Decisions as Superseded

**Modify only with concise notes:**

- `frontend/docs/superpowers/specs/2026-10-01-putnow-modular-refactor-design.md`
- `frontend/docs/superpowers/specs/2026-10-01-putnow-docker-local-design.md`
- `frontend/docs/superpowers/plans/2026-10-01-putnow-modular-refactor-implementation-plan.md`
- `frontend/docs/superpowers/plans/2026-10-01-putnow-docker-local-implementation-plan.md`

**Steps:**

1. Add or extend supersession notes linking to the direct API v1 design.
2. Keep historical v2 content intact so prior decisions remain auditable.
3. Exclude these explicitly historical documents from the active-source `/api/v2` scan.

## Task 8: Run Backend and Active-Source Gates

**Commands:**

```powershell
mvn.cmd test
mvn.cmd package -DskipTests
git diff --check
```

**Scans:**

1. Search Java source, active tests, YAML, JSON, Dockerfiles, environment examples, active READMEs, frontend source, and mock scripts for:
   - `/api/v2`;
   - `V2Controller`;
   - `V1Controller`;
   - `API v2`.
2. Allow matches only in explicitly superseded historical design/plan documents and in the new design/plan text that explains removal.
3. Require all backend tests, including PostgreSQL Testcontainers, to pass without skips.
4. Confirm package creation succeeds.

## Task 9: Run Frontend Regression Gates

**Commands:**

```powershell
corepack.cmd pnpm lint
corepack.cmd pnpm typecheck
corepack.cmd pnpm test
corepack.cmd pnpm build
corepack.cmd pnpm exec playwright test
```

**Steps:**

1. Require lint and TypeScript checks to pass.
2. Require all unit tests to pass.
3. Require the Next.js production build to pass.
4. Require desktop/mobile Playwright flows to pass, allowing only the existing intentional desktop skip for the mobile-only check.

## Task 10: Rebuild Docker Without Resetting PostgreSQL

**Commands:**

```powershell
docker compose up --build --detach --wait
docker compose ps
```

**Steps:**

1. Record the current exact `putnow-postgres-data` volume identity before rebuild.
2. Rebuild backend and frontend images and recreate application containers without removing volumes.
3. Require PostgreSQL, Mailpit, backend, and frontend to report healthy.
4. Verify:
   - `GET http://localhost:8080/api/v1/concerts` succeeds;
   - `GET http://localhost:8080/actuator/health` succeeds;
   - `GET http://localhost:5000/api/health` succeeds;
   - frontend server and browser calls use v1;
   - existing PostgreSQL role/data counts remain present.
5. Confirm the named volume ID is unchanged before and after rebuild.

## Task 11: Final Review State

1. Re-run `git diff --check` in both repositories.
2. Validate the Postman collection JSON.
3. Confirm no usable credentials were introduced.
4. Report exact backend, unit, build, E2E, container-health, and route results.
5. Leave both repositories uncommitted and unpushed.

## Completion Criteria

- The only active API namespace is `/api/v1`.
- Controller classes have ordinary responsibility-based names with no version suffix.
- The current hardened contract and behavior are unchanged.
- Frontend, Docker, tests, mocks, OpenAPI, Postman, and active documentation all use v1.
- Active source/configuration contains no `/api/v2`, `V2Controller`, `V1Controller`, or `API v2` reference.
- All backend and frontend verification gates pass.
- All four Docker services are healthy.
- The existing `putnow-postgres-data` volume is preserved with no schema reset.
- No commit or push is created.
