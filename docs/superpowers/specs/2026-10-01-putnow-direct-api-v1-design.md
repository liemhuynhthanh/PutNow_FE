# PutNow Direct API v1 Design

**Date:** 2026-10-01  
**Status:** Approved, implemented, and verified locally  
**Scope:** Backend HTTP routes, frontend API configuration, local Docker configuration, tests, Postman, and documentation

## 1. Decision

PutNow will expose the current hardened API contract directly under `/api/v1`. The application will not implement, alias, proxy, document, or configure `/api/v2`.

Controller class names will describe their responsibility without a version suffix:

- `AuthenticationController`
- `ConcertController`
- `BookingController`
- `AdminController`

The API version belongs in the HTTP route, not in Java class names.

## 2. Goals

- Move every active backend route from `/api/v2` to `/api/v1`.
- Preserve the current refactored behavior and security contract.
- Remove `V2` from active controller class and file names.
- Point every frontend, Docker, test, mock, OpenAPI, Postman, and environment reference to `/api/v1`.
- Leave no runtime or configuration reference to `/api/v2`.
- Keep changes uncommitted and unpushed for review.

## 3. Preserved Contract

Only the version namespace and controller names change. The following behavior remains unchanged:

- access and refresh credentials use HttpOnly cookies;
- unsafe requests require CSRF protection;
- refresh tokens rotate and reuse revokes their family;
- role, ownership, and public guest-access rules remain enforced;
- public concert list, detail, and ticket-type endpoints remain accessible without login;
- paginated collections retain the current `items`, `page`, `size`, `totalItems`, and `totalPages` shape;
- errors retain the current Spring `ProblemDetail` representation and application error codes;
- booking idempotency, inventory concurrency, voucher limits, expiry processing, SMTP recovery, and Cloudinary behavior remain unchanged.

No database mapping, schema, seed, volume, or Hibernate profile change is part of this work.

## 4. Backend Routes and Naming

The feature-oriented packages remain in place. Only controller file/class names and route prefixes change:

| Current class | Final class | Final base route |
| --- | --- | --- |
| `AuthenticationV2Controller` | `AuthenticationController` | `/api/v1/auth` |
| `ConcertV2Controller` | `ConcertController` | `/api/v1/concerts` |
| `BookingV2Controller` | `BookingController` | `/api/v1/bookings` |
| `AdminV2Controller` | `AdminController` | `/api/v1` |

The current endpoint paths below each controller remain unchanged apart from the version segment. The former legacy controller implementations will not be restored; the refactored controllers become the only API v1 implementation.

Spring Security request matchers will move to `/api/v1/**` while preserving their existing public, authenticated, and administrator rules. OpenAPI groups will match only `/api/v1/**`, and the CSRF guidance will reference `GET /api/v1/auth/csrf`.

## 5. Frontend and Local Runtime

Both frontend API clients will use `/api/v1`:

- browser default: `http://localhost:8080/api/v1`;
- Server Component default in host development: `http://localhost:8080/api/v1`;
- Server Component Docker runtime: `http://backend:8080/api/v1`.

The same values will be reflected in:

- `frontend/.env.example`;
- `frontend/Dockerfile`;
- root `compose.yaml`;
- frontend README and shared Docker runbook.

No BFF, proxy rewrite, compatibility alias, or dual-version routing will be introduced.

## 6. Tests and Mock API

Backend security contract tests will call `/api/v1`. Controller tests, if added or affected, will use the same route namespace.

The frontend Playwright mock API will strip `/api/v1`, and its health probe plus environment variables will use `/api/v1`. Existing browser flows and mock response shapes remain unchanged.

Acceptance includes a source/config scan that permits `/api/v2` only inside historical design documents that are explicitly marked superseded. No Java, TypeScript, JavaScript, YAML, Dockerfile, active README, environment example, test, or mock file may reference `/api/v2`.

## 7. Postman and Documentation

`BookingSystem_Postman_Collection.json` currently uses legacy v1 paths and response assumptions. It will be updated to the refactored v1 contract rather than merely changing labels. Authentication requests must use the current register/login/cookie/CSRF flow, and concert, booking, user, voucher, and media requests must match the active controller paths.

The backend API contract document will become `docs/api-v1.md`. Active README and Docker references will call the API "v1." Earlier specs and plans that selected API v2 will receive a supersession note linking to this design instead of having their historical content silently rewritten.

## 8. Error Handling and Compatibility

There is no compatibility period. `/api/v2` is not an application API and receives no controller mapping or security-specific configuration.

Clients configured with the old `/api/v2` base URL must update to `/api/v1`. This is an intentional coordinated breaking change across the backend and frontend repositories.

## 9. Verification

Implementation is accepted only when:

1. Backend compilation and all backend tests pass.
2. Security contract tests prove guest, authenticated, administrator, CORS, and CSRF behavior through `/api/v1`.
3. OpenAPI groups expose `/api/v1/**` and do not advertise `/api/v2`.
4. Frontend lint, typecheck, unit tests, production build, and Playwright tests pass.
5. Docker Compose builds and all four services become healthy.
6. `GET /api/v1/concerts`, backend health, and frontend health respond successfully.
7. Active source and configuration contain no `/api/v2`, `V2Controller`, or "API v2" references.
8. The PostgreSQL volume is preserved; no schema reset occurs.
9. No commit or push is created.

## 10. Non-Goals

- Supporting both v1 and v2.
- Restoring the old pre-refactor v1 response envelopes or endpoint layout.
- Changing business behavior, DTO shapes, authentication, database schema, or UI design.
- Introducing a future API-version negotiation mechanism.
