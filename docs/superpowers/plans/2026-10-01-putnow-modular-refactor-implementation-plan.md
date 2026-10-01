# PutNow Modular Refactor Implementation Plan

> **Superseded database tasks:** Flyway work in this historical plan is replaced by `2026-10-01-putnow-hibernate-local-schema-implementation-plan.md` for local development.

> **Superseded API-version tasks:** API v2 work in this historical plan is replaced by `2026-10-01-putnow-direct-api-v1-implementation-plan.md`.

**Date:** 2026-10-01  
**Design:** `docs/superpowers/specs/2026-10-01-putnow-modular-refactor-design.md`  
**Repositories:** `frontend` and `../Booking_System`  
**Commit policy:** Keep all implementation changes uncommitted and unpushed for user review.

## Working Rules

- Preserve all existing user changes in both dirty worktrees.
- Do not reset, discard, or overwrite unrelated changes.
- Use tests before modifying authentication, authorization, migrations, inventory, voucher, idempotency, or booking-transition behavior.
- Run the smallest relevant verification after each task and the complete verification suite at the end.
- Never log or commit cookies, tokens, passwords, SMTP credentials, Cloudinary credentials, or database credentials.
- Do not automatically reset or drop an existing database.
- Stop and ask before expanding beyond the approved design.

## Task 1 — Record Baselines and Add Safety Checks

### Backend

1. Record the current `git status`, test result, and package result without changing the worktree.
2. Inspect the effective Spring profiles and document the environment variables required to start locally.
3. Add regression tests for the current public concert, cookie authentication, role authorization, booking transition, and image-upload contracts.
4. Add tests that demonstrate the target failures:
   - Cross-user idempotency-key lookup.
   - Reusable password-reset token.
   - Public sensitive Actuator endpoints.
   - Concurrent status changes that restore inventory more than once.
5. Keep external SMTP and Cloudinary calls mocked.

### Frontend

1. Record lint, typecheck, unit-test, and build baselines.
2. Add regression tests around the current API refresh lock, session behavior, ticket quantity limit, and VND/date formatting.
3. Record the current route list and bundle/build output for comparison.

### Verification

```powershell
# Booking_System
.\mvnw.cmd test
.\mvnw.cmd package -DskipTests

# frontend
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Task 2 — Introduce Flyway and a PostgreSQL Integration-Test Harness

**Repository:** `Booking_System`

### Planned files

- Modify `pom.xml`
- Add `src/main/resources/db/migration/V1__baseline.sql`
- Add later migration placeholders only when their corresponding code is implemented
- Add `src/test/java/com/huynhliem/support/PostgresIntegrationTest.java`
- Add migration integration tests
- Modify application configuration for `ddl-auto=validate`
- Separate development seed configuration from migrations

### Steps

1. Add Flyway PostgreSQL support and Testcontainers PostgreSQL dependencies.
2. Capture the current schema as a non-destructive V1 baseline for new databases.
3. Configure production/default startup to validate the schema instead of generating it.
4. Configure integration tests to start PostgreSQL, apply every migration, then start Spring.
5. Add a migration test for a fresh database.
6. Add an upgrade fixture representing the current pre-Flyway schema and verify the documented baseline-plus-upgrade path.
7. Keep local seed data outside production migrations.
8. Add a migration guide with backup and baseline commands; do not execute destructive local database operations automatically.

### Gate

- A fresh PostgreSQL container migrates and starts successfully.
- An existing-schema fixture upgrades without data loss.
- H2 is no longer treated as proof that PostgreSQL migrations or locks work.

## Task 3 — Establish Shared API v2 Infrastructure

**Repository:** `Booking_System`

### Planned modules

- `shared/errors`
- `shared/pagination`
- `shared/security`
- `shared/configuration`

### Steps

1. Add a consistent `PageResponse<T>`.
2. Replace generic `BaseResponse` usage in v2 with direct resources and page responses.
3. Implement centralized `ProblemDetail` mapping with:
   - Stable application error codes.
   - Field-level validation errors.
   - Safe public detail messages.
   - Request trace ID.
4. Add a request trace filter and structured logging context.
5. Add explicit exception types for conflict, validation, forbidden ownership, rate limiting, and concurrency failure.
6. Configure CORS from an exact origin list.
7. Configure CSRF for every unsafe method.
8. Restrict Actuator exposure and health details.
9. Configure security headers.
10. Add API integration tests for success, validation, authorization, CSRF, CORS, and error shapes.

### Gate

- Sensitive Actuator endpoints are not anonymously accessible.
- Validation responses contain field errors but no internal exception text.
- All v2 unsafe requests require a valid CSRF token.

## Task 4 — Refactor Authentication into a Secure Feature Module

**Repository:** `Booking_System`

### Target package

```text
com.huynhliem.auth
├── api
├── application
├── domain
└── infrastructure
```

### Steps

1. Move authentication HTTP, cookie, token, mail, and persistence responsibilities into the auth feature without changing behavior first.
2. Replace persisted raw refresh JWTs with opaque random refresh secrets whose SHA-256 hashes are stored.
3. Add token-family metadata, rotation state, expiry, revocation reason, and reuse detection.
4. Keep access JWTs short-lived and add only the claims required for authorization/session invalidation.
5. Add an opaque single-use password-reset token table with hash, expiry, used time, and user relationship.
6. Mark reset tokens used in the same transaction as the password update.
7. Revoke all sessions after authenticated or reset-token password changes.
8. Centralize authentication-cookie creation and clearing.
9. Add rate-limiter interfaces. Use a bounded in-memory local implementation and require a shared implementation before multi-instance production.
10. Add v2 authentication endpoints and remove token values from every response.
11. Add integration tests for login, refresh rotation, replay detection, logout, current user, password changes, reset-token single use, enumeration resistance, CSRF, and cookie attributes.

### Migration

- Add `V2__add_token_security.sql` only with the code and tests that consume it.
- Backfill or revoke legacy refresh tokens safely rather than attempting to convert raw JWT rows to opaque-token hashes.

## Task 5 — Refactor Booking, Inventory, and Voucher Transactions

**Repository:** `Booking_System`

### Target modules

- `booking`
- `concert`
- `voucher`

### Steps

1. Introduce enums for booking status, concert status, and discount type.
2. Define booking transitions in the domain and test every allowed and rejected transition.
3. Resolve the authenticated user before looking up an idempotency key.
4. Scope idempotency by user and store a canonical request fingerprint.
5. Return the original booking only for the same key and fingerprint; otherwise return `409`.
6. Merge duplicate ticket-type lines before enforcing the four-ticket maximum.
7. Use conditional atomic inventory decrement statements.
8. Make voucher usage increment conditional on expiry and remaining capacity.
9. Add optimistic locking to booking status changes.
10. Restore inventory and voucher usage only when the transaction wins the terminal-state transition.
11. Change expiry processing to bounded batches with PostgreSQL row locks and `SKIP LOCKED`.
12. Keep cross-feature calls behind explicit application interfaces rather than repositories.
13. Add concurrency integration tests using multiple transactions/threads against PostgreSQL.

### Migrations

- `V3__harden_booking_idempotency.sql`
- `V4__add_constraints_and_indexes.sql`
- `V5__migrate_existing_data.sql`

### Gate

- Concurrent reservations cannot oversell.
- Voucher usage stays within `[0, maxUses]`.
- Cancellation and expiry restore inventory exactly once.
- A user cannot obtain another user's booking through idempotency.

## Task 6 — Complete Feature-Oriented API v2 Modules

**Repository:** `Booking_System`

### Steps

1. Move concerts, ticket types, users, vouchers, bookings, and media into feature packages.
2. Keep controllers thin and application services transaction-focused.
3. Replace mutable request/response DTOs with records where practical.
4. Add v2 resource routes exactly as approved in the design.
5. Enforce role access in Spring Security and ownership in application services.
6. Normalize searchable fields and sorting allowlists.
7. Validate page size limits and reject unsupported sort fields.
8. Keep Cloudinary behind a media interface and retain the 10 MB/type checks.
9. Store timestamps as `Instant` and VND as scale-zero decimal values.
10. Remove v1 controllers and obsolete shared-layer classes only after all v2 tests pass.
11. Update OpenAPI definitions and examples.

### Gate

```powershell
.\mvnw.cmd test
.\mvnw.cmd clean package
```

## Task 7 — Refactor the Frontend Foundation and Design Tokens

**Repository:** `frontend`

### Planned work

1. Add Barlow Condensed and Source Sans 3 with `next/font` and make the CSS tokens actually reference them.
2. Replace the generated palette with the approved PutNow light/dark semantic tokens.
3. Define consistent radius, elevation, spacing, focus, and motion tokens.
4. Add `color-scheme`, matching theme-color metadata, reduced-motion rules, touch-action behavior, and tabular-number utilities.
5. Add a skip link and focusable main landmark.
6. Add or update shadcn Field, Sheet, AlertDialog, Tooltip, and responsive data-display primitives.
7. Replace the custom mobile overlays with accessible Sheet composition.
8. Replace `window.confirm` with AlertDialog.
9. Ensure decorative icons are hidden and icon buttons have accessible names and states.
10. Raise important inputs and controls to at least 44px target size.
11. Keep interactive state transitions limited to explicit transform, opacity, color, border, and shadow properties.
12. Add component-level accessibility and responsive tests.

### Gate

- Keyboard navigation reaches all controls in logical order.
- Focus remains visible and is not hidden behind sticky UI.
- Both color schemes pass the agreed contrast checks.

## Task 8 — Replace the Frontend API Contract with v2 Types

**Repository:** `frontend`

### Steps

1. Replace `BaseResponse<T>` with direct resources, `PageResponse<T>`, and `ProblemDetail` types.
2. Separate the server public API client from the browser credentialed API client.
3. Validate required public and server environment variables at startup/build time.
4. Retain one shared refresh promise and one retry maximum for browser requests.
5. Parse field errors and stable backend error codes.
6. Rebuild query-key factories by feature.
7. Limit invalidation to affected resources.
8. Add contract tests for success, pagination, problem details, CSRF, refresh rotation, multipart upload, and terminal authentication failure.

## Task 9 — Rebuild Public Pages as Server-First App Router Routes

**Repository:** `frontend`

### Steps

1. Refactor homepage, concert list, and concert detail into Server Components.
2. Read concert filters and page state from URL search parameters.
3. Keep only filter controls and ticket selection as client islands.
4. Add route-level loading, error, and not-found files.
5. Add dynamic concert metadata and social image metadata.
6. Replace background-image divs with `next/image`, correct alt text, sizing, priority, and lazy-loading behavior.
7. Implement the approved ticket-editorial homepage and remove the generic numbered card stack.
8. Implement poster/date-rail concert presentation and the responsive concert-detail split layout.
9. Prevent horizontal overflow and preserve readable text measure at all target sizes.

### Gate

- Public concert content appears in server-rendered output.
- Search/filter/pagination URLs are directly shareable and reload-safe.
- No public page requires client JavaScript merely to display fetched content.

## Task 10 — Refactor Authentication, Booking, Account, and Admin UX

**Repository:** `frontend`

### Forms

1. Convert every form to React Hook Form, Zod, and shadcn Field primitives.
2. Associate inline errors with controls and add a focusable error summary for multi-error forms.
3. Add password visibility controls while preserving paste and autocomplete.
4. Replace vague toast-only validation with field-level recovery guidance.
5. Warn before leaving long dirty forms where data loss is meaningful.

### Authenticated data

1. Keep session, booking, account, and admin data in TanStack Query.
2. Preserve role-aware redirects and intended destination behavior.
3. Keep one idempotency key per booking intent and reset it only after success or an intentional cart change.
4. Invalidate booking history, availability, and relevant detail keys after booking mutations.
5. Put admin search, filters, sorting, and pagination in URL parameters.

### Layout

1. Use one primary action per page.
2. Use the accessible Sheet for mobile admin navigation.
3. Convert wide admin tables into labeled mobile cards.
4. Use AlertDialog for destructive status changes.
5. Keep desktop ticket selection sticky without covering focused controls; use natural flow on mobile.

## Task 11 — Add End-to-End and Accessibility Coverage

**Repository:** `frontend`

### Steps

1. Configure Playwright with local frontend/backend startup commands and isolated test data.
2. Add axe checks to representative public, authentication, booking, and admin pages.
3. Cover:
   - Guest concert list/detail/ticket viewing.
   - Registration and shared login with role redirect.
   - Customer booking and history.
   - Admin concert/image, voucher, user, and booking-status flows.
   - Dark mode.
   - 375px mobile, tablet, desktop, and landscape layouts.
4. Add manual checklist results for keyboard, reduced motion, focus, contrast, long content, and empty/error states.

## Task 12 — Documentation and Complete Verification

### Backend documentation

- API v2 endpoints and error model.
- Flyway backup, baseline, migrate, validate, and recovery procedure.
- Cookie, CORS, CSRF, SMTP, Cloudinary, database, and token environment variables.
- Local Testcontainers/Docker requirement.
- Production requirements for HTTPS and a shared rate limiter.

### Frontend documentation

- Local startup order and environment variables.
- Server versus browser API-client responsibilities.
- Design tokens and accessibility expectations.
- Test and E2E commands.

### Final verification

```powershell
# Booking_System
.\mvnw.cmd test
.\mvnw.cmd clean package

# frontend
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm playwright test
```

Final review also includes:

- Flyway validation against a fresh PostgreSQL container.
- Secret-pattern scan and sensitive-log review.
- Review of every changed file and migration.
- `git diff --check` and `git status --short` in both repositories.
- Confirmation that no commit or push was created.

## Completion Gate

Implementation is complete only when every Definition of Done item in the approved design passes, both repository diffs contain only intentional changes, existing user work is preserved, and the full uncommitted diff is ready for user review.
