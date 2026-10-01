# PutNow Modular Refactor Design

**Date:** 2026-10-01  
**Status:** Approved for implementation planning  
**Scope:** `frontend` (Next.js) and `Booking_System` (Spring Boot)

> **Superseded database decision:** The Flyway sections below record the original refactor decision. For the active local-development schema design, see `2026-10-01-putnow-hibernate-local-schema-design.md`. Production remains validation-only.

> **Superseded API-version decision:** The active refactored contract is implemented directly at `/api/v1`; see `2026-10-01-putnow-direct-api-v1-design.md`.

## 1. Goals

Refactor PutNow into a maintainable modular monolith with a server-first Next.js frontend, a versioned REST API, explicit PostgreSQL migrations, and hardened authentication and booking concurrency.

The refactor may introduce breaking API and schema changes. Existing local data must be migrated without an automatic reset or destructive schema recreation.

Primary outcomes:

- Eliminate the high-risk security and cross-user data exposure findings.
- Make booking inventory, voucher usage, expiry, and status changes concurrency-safe.
- Replace ad-hoc schema evolution with Flyway migrations.
- Replace client-heavy public pages with server-rendered App Router pages.
- Establish a distinctive, accessible, responsive PutNow design system.
- Preserve the existing business scope while improving its implementation.

## 2. Repository Boundary

The application remains split into two repositories located under the same parent directory:

```text
Booking Platform/
├── Booking_System/  # Spring Boot API
└── frontend/        # Next.js application
```

The frontend continues to run on `localhost:3000` and the backend on `localhost:8080` during local development. Cookie authentication, exact-origin CORS, and CSRF protection remain required.

No Backend-for-Frontend layer or same-origin deployment is introduced in this refactor.

## 3. Backend Architecture

The backend becomes a feature-oriented modular monolith:

```text
com.huynhliem
├── auth
│   ├── api
│   ├── application
│   ├── domain
│   └── infrastructure
├── booking
├── concert
├── user
├── voucher
├── media
└── shared
    ├── configuration
    ├── errors
    ├── pagination
    └── security
```

Responsibilities:

- API/controller classes handle HTTP mapping, validation, and DTO conversion only.
- Application services define use cases and transaction boundaries.
- Domain classes and enums contain state and business rules.
- Infrastructure packages contain JPA repositories and external integrations.
- One feature must not access another feature's repository directly. Cross-feature work uses an application service or explicit interface.
- Spring Security enforces route-level roles. Domain ownership and resource access remain enforced in the application layer.

## 4. API v2

The frontend moves entirely to `/api/v2`. Version 1 is removed after the coordinated local migration.

| Use case | Endpoint |
|---|---|
| List public concerts | `GET /api/v2/concerts` |
| Get concert | `GET /api/v2/concerts/{id}` |
| Get ticket types | `GET /api/v2/concerts/{id}/ticket-types` |
| Create concert (ADMIN) | `POST /api/v2/concerts` |
| Get availability (ADMIN) | `GET /api/v2/concerts/{id}/availability` |
| Create booking | `POST /api/v2/bookings` |
| Get current user's bookings | `GET /api/v2/bookings` |
| Get owned booking | `GET /api/v2/bookings/{id}` |
| Change booking status (ADMIN) | `PATCH /api/v2/bookings/{id}/status` |
| Manage users (ADMIN) | `GET/POST /api/v2/users` |
| Manage vouchers (ADMIN) | `GET/POST /api/v2/vouchers` |
| Upload image (ADMIN) | `POST /api/v2/media/images` |

Successful resources are returned directly. Paginated collections use:

```json
{
  "items": [],
  "page": 0,
  "size": 20,
  "totalItems": 0,
  "totalPages": 0
}
```

Errors use Spring `ProblemDetail` with a stable application code, optional field errors, and a trace ID:

```json
{
  "type": "https://putnow.app/problems/validation",
  "title": "Request validation failed",
  "status": 400,
  "detail": "Correct the highlighted fields.",
  "code": "VALIDATION_ERROR",
  "fieldErrors": {
    "email": "Enter a valid email address."
  },
  "traceId": "..."
}
```

## 5. Authentication and Security

- Access tokens remain short-lived JWTs stored in `HttpOnly` cookies.
- Refresh tokens become opaque random secrets. Only their SHA-256 hashes are stored.
- Refresh tokens rotate on every refresh and belong to a token family.
- Reuse of a rotated token revokes its full family.
- Logout and password changes revoke every active session for the user.
- Password reset tokens are opaque, hashed, expiring, and single-use with `usedAt` tracking.
- Login, refresh, forgot-password, and reset-password endpoints are rate-limited.
- The local profile may use an in-memory limiter. A production multi-instance deployment must provide a shared Redis or gateway implementation.
- CSRF is required for every unsafe HTTP method.
- CORS accepts an exact environment-configured origin list and never uses a credentialed wildcard.
- Local cookies use `Secure=false` and `SameSite=Lax`.
- Cross-site production cookies require HTTPS, `Secure=true`, and `SameSite=None`.
- Only the general Actuator health endpoint is public. Beans, loggers, metrics detail, and health internals are not public.
- Security headers are configured centrally.
- Logs and responses never expose tokens, reset links, passwords, SQL errors, or stack traces.

## 6. Booking and Concurrency

Booking idempotency is scoped by user:

```text
UNIQUE(user_id, idempotency_key)
```

Each idempotency record stores a request fingerprint:

- Same user, key, and payload returns the original booking.
- Same user and key with a different payload returns `409 Conflict`.
- A key can never return another user's booking.

Additional rules:

- Duplicate ticket-type rows are combined before validating the four-ticket limit.
- Inventory decrements use conditional atomic updates.
- Voucher usage updates are atomic and cannot exceed `maxUses` or become negative.
- Booking status uses a Java enum plus a database check constraint.
- Booking rows use optimistic locking to reject concurrent state transitions.
- Expiry processing uses batches and row locking with `SKIP LOCKED` so multiple instances cannot restore inventory twice.
- Existing transition rules remain: `PENDING -> PAID|CANCELLED`, `PAID -> CANCELLED`; terminal states do not transition.

## 7. Database and Flyway

Flyway becomes the only schema evolution mechanism. Hibernate uses `ddl-auto=validate`.

Planned migrations:

```text
V1__baseline.sql
V2__add_token_security.sql
V3__harden_booking_idempotency.sql
V4__add_constraints_and_indexes.sql
V5__migrate_existing_data.sql
```

Schema decisions:

- Time values use PostgreSQL `timestamptz` and Java `Instant`.
- VND monetary values use `numeric(19,0)`.
- Normalized username and email values have explicit unique constraints.
- Booking idempotency, request fingerprints, token families, reset tokens, and optimistic-lock versions receive dedicated columns/tables.
- Statuses, quantities, monetary values, discounts, and usage counts receive database constraints.
- Frequently used concert, booking expiry, booking history, and token-cleanup queries receive indexes.
- Schema changes and data backfills use separate migrations.
- Development seed data is profile-specific and not mixed with production migration logic.

For a new database, Flyway starts at V1. For an existing local database, the operator must first create a backup, baseline it at V1, then apply V2 and later migrations. The application must not automatically drop or recreate the schema.

## 8. Frontend Architecture

Public pages are server-first:

- Homepage, concert listing, and concert detail render as Server Components.
- Public data is fetched on the server.
- Route-level `loading.tsx`, not-found behavior, and dynamic metadata are provided.
- URL query parameters are the source of truth for search, filters, and pagination.
- Interactive filters and ticket selection are small Client Components.

Authenticated areas continue to use browser-side TanStack Query because authentication cookies belong to the backend origin:

- TanStack Query manages session, bookings, admin queries, and mutations.
- Mutations invalidate only related query keys.
- Large client pages are split into a server shell and focused interactive feature components.
- Server and browser API clients share the same response and error types.
- React Hook Form, Zod, and shadcn Field primitives are used consistently for forms.

Images use `next/image` with explicit sizing or `fill`, meaningful alt text, lazy loading below the fold, and priority only for the LCP image.

## 9. PutNow Design System

Visual direction: **modern ticket editorial**. The interface is restrained and content-led, inspired by concert tickets and event posters rather than generic SaaS cards.

The single distinctive motif is a ticket rail: a date or ticket-information strip combined with a restrained perforated divider. It is not repeated on every component.

Decorative gradients are not used. A subtle dark image scrim is allowed only when required for text legibility.

### Color tokens

| Token | Light | Dark |
|---|---:|---:|
| Background | `#F7F7F5` | `#0E1118` |
| Surface | `#FFFFFF` | `#171C26` |
| Primary text | `#171A21` | `#F4F5F7` |
| Muted text | `#626977` | `#A7AFBE` |
| Brand blue | `#3157D5` | `#7892F2` |
| Border | `#DDE0E6` | `#303746` |

Success, warning, and destructive colors use semantic tokens and are not hardcoded inside components.

### Typography

- Barlow Condensed: headings and concert titles.
- Source Sans 3: body text, forms, and administration screens.
- Prices, quantities, and table values use tabular numerals.
- Body text is at least 16px on mobile.
- Long text is constrained to a readable measure.
- Eyebrows are not universally uppercase.
- Headlines do not highlight an arbitrary phrase using a different color.

### Layout

- Homepage: editorial hero plus one featured concert/ticket panel; remove the generic three-card numbered feature stack.
- Concert listing: content-led cards or rows with poster, date rail, venue, and availability.
- Concert detail: poster and information with a desktop sticky ticket selector; natural document flow on mobile.
- Admin: sidebar on desktop, accessible shadcn Sheet on mobile.
- Admin tables become labeled cards on narrow screens instead of forcing horizontal scrolling.
- Each page has one visually dominant primary action.
- Radius and elevation vary by hierarchy instead of using one rounded-card treatment everywhere.

## 10. Accessibility and Interaction

- Add a skip link to the main content.
- Maintain semantic headings and landmarks.
- Decorative icons are hidden from assistive technology.
- Icon-only controls have accessible names and expose expanded/selected state where applicable.
- Mobile navigation uses an accessible Sheet and managed focus.
- Destructive confirmation uses `AlertDialog`, not `window.confirm`.
- Inputs and important buttons provide at least a 44px target.
- Field errors use `aria-describedby`; multi-error forms provide a focusable error summary and focus the first invalid field.
- Password controls support paste, password managers, and show/hide behavior.
- Toasts announce updates without stealing focus.
- Motion uses transform/opacity, stays minimal, and respects `prefers-reduced-motion`.
- Dark and light mode contrast are verified independently.
- The document applies matching `color-scheme` and theme color metadata.
- Responsive review covers 375px, tablet, desktop, and landscape layouts.

## 11. Testing

### Backend

Unit tests cover domain rules and status transitions. PostgreSQL integration tests use Testcontainers and require Docker Desktop locally.

Integration coverage includes:

- Flyway migration from an empty database.
- Upgrade from the current schema.
- Concurrent inventory reservations.
- Voucher usage bounds.
- Single inventory restoration during booking expiry.
- User-scoped idempotency.
- Refresh rotation and reuse detection.
- Single-use password reset tokens.
- CSRF, CORS, role, and ownership enforcement.

H2 is not the primary integration environment because it cannot validate PostgreSQL-specific locking and migrations.

### Frontend

Vitest and Testing Library cover API errors, refresh deduplication, query invalidation, forms, focus behavior, quantity limits, VND totals, idempotency, and role redirects.

Playwright covers guest concert browsing, authentication and role routing, customer booking history, core admin flows, responsive behavior, and dark mode. Axe checks supplement manual keyboard and screen-reader-oriented review.

## 12. Verification and Local Rollout

Rollout order:

1. Back up the current PostgreSQL database.
2. Baseline and migrate it with Flyway.
3. Start the backend API v2.
4. Run backend unit and PostgreSQL integration tests.
5. Move the frontend to API v2.
6. Run frontend lint, types, unit tests, build, and E2E tests.
7. Review keyboard, responsive, reduced-motion, and dark-mode behavior.
8. Present both repository diffs without committing or pushing.

Backend quality gates:

```text
./mvnw test
Flyway validate
No committed secrets
No unintended public sensitive endpoints
```

Frontend quality gates:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm playwright test
```

## 13. Non-Goals

This refactor does not add:

- A payment gateway.
- A Redis production deployment.
- Production hosting infrastructure.
- A Next.js Backend-for-Frontend.
- Unrelated product features.

It may add interfaces, environment documentation, and extension points required for future production infrastructure.

## 14. Definition of Done

- High-risk security findings are fixed and covered by tests.
- Booking and voucher concurrency cannot oversell or double-restore inventory.
- API v2 and all schema migrations are tested.
- Public concert pages render content on the server.
- Primary workflows work across mobile, tablet, and desktop.
- Dark mode, keyboard operation, focus behavior, and form accessibility pass the agreed checklist.
- `.env.example`, README files, and the migration guide are updated.
- Changes remain uncommitted and unpushed for user review.
