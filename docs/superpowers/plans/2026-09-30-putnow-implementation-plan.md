# PutNow Implementation Plan

**Date:** 2026-09-30  
**Design:** `docs/superpowers/specs/2026-09-30-putnow-frontend-design.md`  
**Repositories:** `frontend` and `../Booking_System`

## Goal

Implement the approved PutNow customer and administrator frontend, together with the minimum backend contract and security changes required for public concert discovery, cookie authentication, Cloudinary uploads, role-aware sessions, legal booking state transitions, and safe password changes.

No payment, QR, seat-map, organizer, or other excluded feature is added by this plan.

## Working rules

- Work in small, independently verifiable tasks.
- Add or update tests before changing critical authentication, authorization, inventory, or status-transition behavior.
- Keep backend and frontend commits separate because they are independent repositories.
- Never commit JWT or Cloudinary secrets.
- Never log tokens, cookies, passwords, or reset links containing tokens.
- Preserve unrelated user changes in both repositories.
- Stop and ask before broadening the approved API or product scope.

## Task 1 — Establish backend regression coverage

**Repository:** `Booking_System`

### Files

- Add `src/test/java/com/huynhliem/controller/AuthenticationControllerIntegrationTest.java`
- Add `src/test/java/com/huynhliem/controller/ConcertControllerIntegrationTest.java`
- Add `src/test/java/com/huynhliem/controller/UserAuthorizationIntegrationTest.java`
- Extend `src/test/java/com/huynhliem/service/impl/ConcertServiceImplTest.java`
- Add or extend booking service tests under `src/test/java/com/huynhliem/service/impl/`

### Steps

1. Run the existing test suite and record the baseline result.
2. Add integration-test infrastructure using the existing H2 test dependency and Spring Security test support.
3. Cover the current login, refresh, logout, concert listing, booking, and admin authorization behavior before modifying it.
4. Add failing tests for the approved target behavior:
   - Guest concert list/detail/ticket-type access.
   - User-management denial for `USER`.
   - Cookie login and refresh.
   - Refresh-token rotation and old-token rejection.
   - `/auth/me` identity and role.
   - Authenticated password change and all-session revocation.
   - Legal and illegal booking transitions.
5. Keep Cloudinary calls mocked in backend automated tests.

### Verification

```powershell
.\mvnw.cmd test
```

Expected at this stage: existing tests pass and new target-behavior tests fail for the intended missing behavior only.

## Task 2 — Harden backend authentication configuration

**Repository:** `Booking_System`

### Files

- Modify `src/main/resources/application.yaml`
- Modify `src/main/java/com/huynhliem/config/AppConfig.java`
- Modify `src/main/java/com/huynhliem/config/PreFilter.java`
- Add `src/main/java/com/huynhliem/config/AuthCookieProperties.java`
- Add local configuration documentation to `Readme.md`

### Steps

1. Replace committed JWT secret values with environment-variable references for access, refresh, and reset secrets.
2. Define typed local cookie properties: names, paths, lifetimes, `HttpOnly`, `SameSite=Lax`, and `Secure=false` for local development.
3. Configure CORS with the exact local origin `http://localhost:3000` and credential support.
4. Enable CSRF with a readable XSRF cookie and `X-XSRF-TOKEN` request header.
5. Add `GET /api/v1/auth/csrf` to issue the `XSRF-TOKEN` cookie before state-changing frontend calls.
6. Change `PreFilter` to read the access token from its cookie.
7. Remove logging of authorization values and tokens.
8. Preserve only non-sensitive request/authentication context in logs.
9. Make security rules explicit for public, customer, and admin endpoints.

### Verification

- Configuration loads when required environment variables are present.
- Missing secrets fail startup clearly rather than silently using committed defaults.
- Tests confirm CORS and CSRF behavior.
- A repository search finds no committed secret value or complete-token log statement.

## Task 3 — Implement cookie authentication and session APIs

**Repository:** `Booking_System`

### Files

- Modify `src/main/java/com/huynhliem/controller/AuthenticationController.java`
- Modify `src/main/java/com/huynhliem/service/AuthenticationService.java`
- Modify `src/main/java/com/huynhliem/service/impl/AuthenticationServiceImpl.java`
- Modify `src/main/java/com/huynhliem/service/TokenService.java`
- Modify `src/main/java/com/huynhliem/service/impl/TokenServiceImpl.java`
- Modify `src/main/java/com/huynhliem/repository/TokenRepository.java`
- Add `src/main/java/com/huynhliem/service/AuthCookieService.java`
- Add `src/main/java/com/huynhliem/dto/request/AuthenticatedPasswordChangeRequest.java`
- Add `src/main/java/com/huynhliem/dto/response/CurrentUserResponse.java`
- Add `src/main/java/com/huynhliem/service/EmailService.java`
- Add `src/main/java/com/huynhliem/service/impl/SmtpEmailService.java`
- Add `src/main/java/com/huynhliem/config/MailConfig.java`
- Add SMTP variable names to `.env.example`
- Update authentication tests from Task 1

### Steps

1. Centralize creation and clearing of access and refresh cookies.
2. Change login so tokens are delivered only by `HttpOnly` cookies, not exposed in the JSON response.
3. Implement `GET /api/v1/auth/me` returning `id`, `name`, `email`, `phone`, and `role`.
4. Change refresh to:
   - Read the refresh cookie.
   - Verify JWT validity.
   - Verify the stored token is not revoked.
   - Revoke the old refresh token.
   - Generate and persist a new refresh token.
   - Replace access and refresh cookies.
5. Ensure reuse of the old refresh token fails.
6. Change logout to revoke the user's stored refresh tokens and clear authentication cookies.
7. Add `PUT /api/v1/auth/password` for authenticated password changes.
8. Verify `currentPassword`, password confirmation, and password policy.
9. On success, encode the new password, revoke all stored tokens, clear current cookies, and require login again.
10. Keep the existing reset-token password flow separate.
11. Send forgot-password links through SMTP, return a generic response for unknown email addresses, and keep provider credentials in environment variables only.

### Verification

- Integration tests validate cookie attributes, role response, rotation, logout, CSRF, and password behavior.
- API responses contain no access or refresh token.
- Concurrent refresh behavior is safe at the persistence layer: only a non-revoked stored token can rotate successfully.

## Task 4 — Implement approved domain API changes

**Repository:** `Booking_System`

### Concert access

**Files:**

- Modify `src/main/java/com/huynhliem/controller/ConcertController.java`
- Modify `src/main/java/com/huynhliem/service/ConcertService.java`
- Modify `src/main/java/com/huynhliem/service/impl/ConcertServiceImpl.java`
- Modify `src/main/java/com/huynhliem/config/AppConfig.java`

**Steps:**

1. Add `GET /api/v1/concerts/{id}`.
2. Permit guest access only to concert list, concert detail, and ticket types by concert.
3. Keep concert creation and availability restricted to `ADMIN`.
4. Cover found and not-found detail responses.

### User authorization

**Files:**

- Modify `src/main/java/com/huynhliem/config/AppConfig.java`
- Review `src/main/java/com/huynhliem/controller/UserController.java`

**Steps:**

1. Restrict current user-management endpoints to `ADMIN`.
2. Confirm a `USER` cannot list, inspect, or create other users.
3. Use `/auth/me` for the signed-in customer's own summary.

### Booking transitions

**Files:**

- Modify `src/main/java/com/huynhliem/service/impl/BookingServiceImpl.java`
- Update booking tests

**Steps:**

1. Represent the accepted statuses and transitions explicitly.
2. Permit `PENDING → PAID`, `PENDING → CANCELLED`, scheduler-driven `PENDING → EXPIRED`, and `PAID → CANCELLED`.
3. Reject arbitrary status strings and every other transition.
4. Restore inventory and voucher use exactly once on transition to `CANCELLED` or `EXPIRED`.
5. Preserve idempotent booking creation and current quantity rules.

### Verification

```powershell
.\mvnw.cmd test
```

All public-access, authorization, and booking-transition tests must pass.

## Task 5 — Add Cloudinary image upload

**Repository:** `Booking_System`

### Files

- Modify `pom.xml`
- Add `src/main/java/com/huynhliem/config/CloudinaryConfig.java`
- Add `src/main/java/com/huynhliem/controller/MediaController.java`
- Add `src/main/java/com/huynhliem/service/MediaService.java`
- Add `src/main/java/com/huynhliem/service/impl/CloudinaryMediaService.java`
- Add `src/main/java/com/huynhliem/dto/response/ImageUploadResponse.java`
- Add `src/test/java/com/huynhliem/controller/MediaControllerIntegrationTest.java`
- Add `src/test/java/com/huynhliem/service/impl/CloudinaryMediaServiceTest.java`
- Update `src/main/resources/application.yaml`
- Update `Readme.md`

### Steps

1. Add the official Cloudinary Java SDK.
2. Read cloud name, API key, and API secret from environment variables.
3. Add the admin-only multipart endpoint `POST /api/v1/media/admin/images`.
4. Validate that the file is non-empty, no larger than 10 MB, and identified as JPEG, PNG, or WebP.
5. Reject mismatches between declared type and accepted image content where the chosen validation library permits inspection.
6. Upload into a PutNow concert-images folder.
7. Return only the image URL and non-sensitive asset metadata needed by the form.
8. Mock Cloudinary in automated tests; do not require live credentials in CI.

### Verification

- Valid mocked uploads return an image URL.
- Unsupported, empty, and oversized files fail with safe `400` responses.
- `USER` and guest callers receive `403` or `401` as appropriate.

## Task 6 — Scaffold the frontend repository

**Repository:** `frontend`

### Files

- Create the Next.js application at the repository root without replacing `docs/`
- Add `.env.example`
- Add `.gitignore`
- Add `components.json`
- Add `vitest.config.ts`
- Add `playwright.config.ts`
- Add `src/app/providers.tsx`
- Add theme and global-style files
- Update `README.md`

### Steps

1. Generate a Next.js App Router scaffold with TypeScript, Tailwind CSS, ESLint, `src/`, and the `@/*` alias in a temporary sibling directory using `pnpm` because the repository root already contains the committed `docs` directory.
2. Apply the generated scaffold to `frontend`, preserving `.git` and `docs`, verify the merged tree, and then remove only the verified temporary scaffold directory.
3. Install and configure shadcn/ui, TanStack Query, React Hook Form, Zod, theme support, Vitest, React Testing Library, and Playwright.
4. Define `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1` in `.env.example` without secrets.
5. Set global design tokens for the approved light and dark PutNow palette.
6. Add QueryClient, theme, toast, and session providers in the root composition.
7. Add scripts for type-checking, unit tests, E2E tests, and verification.

### Verification

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

## Task 7 — Build the typed API and session foundation

**Repository:** `frontend`

### Files

- Add `src/types/api.ts`
- Add domain types under `src/types/`
- Add `src/lib/api/client.ts`
- Add `src/lib/api/errors.ts`
- Add `src/lib/api/csrf.ts`
- Add `src/lib/query/client.ts`
- Add query-key factories under `src/lib/query/`
- Add `src/features/auth/api.ts`
- Add `src/features/auth/queries.ts`
- Add `src/features/auth/session-provider.tsx`
- Add unit tests beside these modules

### Steps

1. Model the generic `BaseResponse<T>` and pagination metadata.
2. Model every request/response currently consumed by the frontend.
3. Build one fetch-based API client with:
   - Configured backend base URL.
   - `credentials: "include"`.
   - JSON and multipart handling.
   - Safe `BaseResponse` parsing.
   - CSRF header injection for state-changing calls.
4. Implement a single shared refresh promise for concurrent `401` responses.
5. Retry the original request no more than once after refresh.
6. Prevent refresh recursion for login, refresh, logout, CSRF, and public calls.
7. Normalize validation, authorization, not-found, business, network, and unexpected errors.
8. Implement `/auth/me` as the session source and expose role-aware session state.
9. Clear authenticated query data on logout or terminal refresh failure.

### Verification

- Unit tests cover normal responses, backend errors, multipart requests, CSRF headers, concurrent refresh, one-time retry, and refresh failure.

## Task 8 — Implement shared layouts and UI states

**Repository:** `frontend`

### Files

- Add public/customer/admin layouts under `src/app/`
- Add layout components under `src/components/layout/`
- Add shared components under `src/components/shared/`
- Add required shadcn/ui components under `src/components/ui/`
- Add component tests

### Steps

1. Build `CustomerHeader`, responsive mobile navigation, `AdminSidebar`, and admin mobile sheet.
2. Build the PutNow wordmark and shared footer.
3. Build `ThemeToggle` with system preference and persistent manual selection.
4. Build `Skeleton`, `EmptyState`, `ErrorState`, `StatusBadge`, formatting components, pagination, confirmation dialog, and toast patterns.
5. Implement frontend route guards for customer/admin navigation while relying on backend authorization for security.
6. Confirm keyboard navigation, visible focus states, labels, semantic headings, and adequate contrast.

### Verification

- Component tests cover navigation variants, theme toggling, guards, and state components.
- Manual responsive check at mobile, tablet, and desktop widths.

## Task 9 — Implement public discovery and authentication

**Repository:** `frontend`

### Files

- Add pages under `src/app/(public)/`
- Add `src/features/concerts/` modules
- Complete `src/features/auth/` forms and schemas
- Add route-level loading, error, and not-found files
- Add tests for public and authentication flows

### Steps

1. Implement the home page and concert listing.
2. Add keyword, status, page, size, and sort URL parameters.
3. Implement concert detail and ticket-type loading.
4. Implement login, registration, forgot-password, reset-token validation, and reset-password completion.
5. Redirect by role after login.
6. Preserve the intended destination when a guest is redirected to login before booking.
7. Add English validation and safe backend error presentation.
8. Provide responsive loading, empty, error, and not-found states.

### Verification

- Component/integration tests cover search parameters, detail loading, form validation, role redirects, and auth errors.
- Playwright covers guest discovery and the complete authentication flows.

## Task 10 — Implement customer booking and account flows

**Repository:** `frontend`

### Files

- Add `src/features/bookings/` modules
- Add customer booking pages under `src/app/(customer)/`
- Add account pages and authenticated password form
- Add unit, component, and E2E tests

### Steps

1. Build the ticket selector supporting multiple ticket types.
2. Enforce a client-side total of one to four tickets while retaining backend enforcement.
3. Add an optional voucher field and computed display summary using decimal-safe values.
4. Generate one idempotency key per booking intent and retain it across a manual retry of the same request.
5. Disable duplicate submission while a mutation is pending.
6. On success, invalidate booking history and ticket availability and show the returned `PENDING` booking.
7. Implement history and detail pages scoped to the current user.
8. Show expiration using Asia/Ho_Chi_Minh display rules.
9. Implement account summary from `/auth/me`.
10. Implement authenticated password change and redirect to login after backend session revocation.

### Verification

- Tests cover multi-ticket totals, limit enforcement, idempotency-key reuse, mutation invalidation, booking states, and password-change logout.
- Playwright covers the complete customer flow.

## Task 11 — Implement the admin dashboard

**Repository:** `frontend`

### Files

- Add pages under `src/app/admin/`
- Add admin components within `src/features/concerts/`, `bookings/`, `users/`, and `vouchers/`
- Add image-upload API and form integration
- Add unit, component, and E2E tests

### Steps

1. Build an overview using counts and summaries obtainable from existing endpoints; do not invent unsupported analytics.
2. Build concert list, availability view, and create form.
3. Upload and validate the concert image before submitting the concert.
4. Support dynamic ticket-type rows in the concert form.
5. Build paginated booking management with only legal status actions.
6. Require confirmation before cancelling a paid booking.
7. Build paginated/searchable user list, detail, and create-user form.
8. Build voucher list and create form for percentage and fixed-amount vouchers.
9. Format all amounts as VND and all times in Asia/Ho_Chi_Minh.
10. Implement responsive table behavior and full loading, empty, and error states.

### Verification

- Component tests cover admin forms, status-action visibility, pagination, image validation, and table states.
- Playwright covers concert creation, booking changes, user management, and voucher creation.

## Task 12 — Complete cross-repository verification

### Backend verification

```powershell
.\mvnw.cmd test
.\mvnw.cmd clean package
```

### Frontend verification

```powershell
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
pnpm exec playwright test
```

### Manual verification

1. Start PostgreSQL and the Spring Boot backend with local environment variables.
2. Start Next.js at port 3000.
3. Verify cookies, CORS, CSRF, login, refresh rotation, logout, and password-change revocation in browser developer tools without exposing token values in logs or screenshots.
4. Verify guest, customer, and admin access boundaries.
5. Verify Cloudinary upload with real local credentials.
6. Verify booking inventory and transition behavior.
7. Verify English copy, VND formatting, Asia/Ho_Chi_Minh times, responsive layouts, and both themes.
8. Update both READMEs with exact local startup order and required environment-variable names.

## Completion gate

Implementation is complete only when every Definition of Done item in the approved design passes, both repositories have clean working trees aside from intentional user changes, and no excluded feature has been introduced.
