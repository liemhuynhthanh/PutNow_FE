# PutNow Frontend Design

**Date:** 2026-09-30  
**Status:** Approved design  
**Frontend repository:** `D:\Booking Platform\frontend`  
**Backend repository:** `D:\Booking Platform\Booking_System`

## 1. Objective

Build a responsive English-language web frontend for the existing concert booking backend. The product serves customers and administrators. The implementation must use only features supported by the existing backend plus the explicitly approved backend contract changes in this document.

The initial environment is local development:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Production domains and production cookie settings are outside the current scope.

## 2. Confirmed technology choices

- Next.js with App Router
- TypeScript
- `pnpm`
- Tailwind CSS
- shadcn/ui
- TanStack Query for client-side server-state management
- React Hook Form and Zod for forms and client validation
- Light and dark themes
- Vitest and React Testing Library
- Playwright for browser end-to-end tests

The frontend and backend remain separate Git repositories located in the same parent directory.

## 3. Product scope

### 3.1 Actors

#### Guest

- Browse, search, filter, and paginate concerts.
- View concert details and available ticket types.
- Register, log in, request a password reset, and reset a password.
- When attempting to book, the guest is redirected to login.

#### Customer (`USER`)

- Use all guest capabilities.
- Select one or more ticket types for a concert.
- Purchase no more than four tickets in one booking.
- Apply an optional voucher code.
- Create a booking with an idempotency key.
- View personal booking history and booking details.
- View account information and change password by providing the current password.
- Be signed out from every session after a successful authenticated password change.
- Log out.

#### Administrator (`ADMIN`)

- Log in through the same login page as customers.
- Be redirected to the admin dashboard based on the role returned by the backend.
- View the admin overview.
- List concerts and inspect ticket availability.
- Create a concert with ticket types and an uploaded image.
- List bookings and perform legal status transitions.
- List, search, inspect, and create users.
- List and create vouchers.
- Log out.

### 3.2 Explicitly excluded

The following features are not included because the approved backend scope does not support them:

- Payments and refunds
- Electronic ticket generation
- QR ticket validation and check-in
- Assigned seating and seat maps
- Organizer accounts or organizer dashboards
- Editing or deleting concerts
- Editing or deleting vouchers
- Editing profile information
- Real-time WebSocket updates

## 4. Visual direction

- Brand name: **PutNow**
- English-only interface
- Modern and approachable visual style
- Predominantly light, neutral surfaces
- Simple color palette with purple as the primary accent
- Gradients used sparingly and only as minor accents
- Clear cards, typography hierarchy, and whitespace
- Full responsive support for mobile, tablet, and desktop
- Light and dark modes, initially following the operating system preference with a manual toggle
- Customer pages use a top navigation bar
- Admin pages use a sidebar that becomes a slide-out sheet on small screens

## 5. Application architecture

```text
Browser at localhost:3000
        |
        | REST requests with credentials
        v
Next.js App Router frontend
        |
        | HTTP/JSON
        v
Spring Boot API at localhost:8080
        |                    |
        v                    v
PostgreSQL              Cloudinary
```

### 5.1 Rendering model

- Public discovery pages use Server Components where server rendering materially improves initial rendering and page metadata.
- Interactive areas use Client Components: forms, ticket selection, authenticated session UI, customer bookings, admin tables, filters, dialogs, and mutations.
- TanStack Query owns browser-side server state for interactive and authenticated data.
- Backend data remains authoritative. Frontend cache never decides ticket availability, authorization, booking status, or voucher validity.

### 5.2 Frontend module boundaries

```text
src/
├── app/
│   ├── (public)/
│   ├── (customer)/
│   ├── admin/
│   └── providers.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
├── features/
│   ├── auth/
│   ├── concerts/
│   ├── bookings/
│   ├── users/
│   └── vouchers/
├── lib/
│   ├── api/
│   ├── query/
│   ├── validation/
│   └── formatting/
└── types/
```

- `app` defines routing and composes screens.
- `features` contains domain-specific components, hooks, schemas, and API functions.
- `components/ui` contains shadcn/ui primitives.
- `components/layout` contains customer and admin shells.
- `components/shared` contains reusable application-level components.
- `lib/api` contains the typed HTTP client, response normalization, refresh coordination, and CSRF handling.
- `lib/query` contains the QueryClient setup and query-key factories.
- `lib/validation` contains shared Zod schemas.
- `lib/formatting` contains VND and Asia/Ho_Chi_Minh formatting utilities.
- `types` contains shared API and domain types.

## 6. Route map

### 6.1 Public routes

| Route | Responsibility |
|---|---|
| `/` | Brand introduction, featured content, and upcoming concerts |
| `/concerts` | Searchable, filterable, paginated concert list |
| `/concerts/[id]` | Concert detail, ticket availability, ticket selector, and booking entry point |
| `/login` | Shared customer/admin login |
| `/register` | Customer registration |
| `/forgot-password` | Password-reset request |
| `/reset-password` | Password reset using the backend reset token |

### 6.2 Customer routes

| Route | Responsibility |
|---|---|
| `/bookings` | Current user's booking history |
| `/bookings/[id]` | Current user's booking detail |
| `/account` | Current user's profile summary |
| `/account/change-password` | Authenticated password change requiring the current password |

### 6.3 Admin routes

| Route | Responsibility |
|---|---|
| `/admin` | Overview derived from available APIs |
| `/admin/concerts` | Concert list and availability access |
| `/admin/concerts/new` | Concert creation with ticket types and image upload |
| `/admin/bookings` | Paginated booking management and legal status actions |
| `/admin/users` | Paginated user list, search, and detail access |
| `/admin/users/new` | User creation |
| `/admin/vouchers` | Paginated voucher list |
| `/admin/vouchers/new` | Voucher creation |

## 7. Shared components

- `CustomerHeader`
- `AdminSidebar`
- `MobileNavigation`
- `ThemeToggle`
- `ConcertCard`
- `TicketSelector`
- `BookingSummary`
- `DataTable`
- `Pagination`
- `SearchAndFilters`
- `StatusBadge`
- `CurrencyText`
- `DateTimeText`
- `FormField`
- `ConfirmDialog`
- `Toast`
- `Skeleton`
- `EmptyState`
- `ErrorState`

On mobile, tables retain only priority columns and expose full row details through a drawer or dedicated detail navigation. Forms use one column on mobile and grouped layouts on wider screens.

## 8. Authentication and authorization

### 8.1 Cookie session

- Spring Boot issues access and refresh tokens as `HttpOnly` cookies.
- For local development, cookies use settings compatible with `localhost:3000` and `localhost:8080`, including `SameSite=Lax` and `Secure=false`.
- Browser requests to the backend include credentials.
- JavaScript does not read either authentication token.
- `GET /api/v1/auth/me` returns `id`, `name`, `email`, `phone`, and `role`.
- A single login page handles both roles.
- Successful login redirects `USER` to the customer area and `ADMIN` to `/admin`.
- Every successful refresh rotates the refresh token, revokes the previous token, and replaces the refresh cookie.

### 8.2 Refresh coordination

- When an authenticated request receives `401`, the API client starts one refresh request.
- Concurrent requests reuse the same in-flight refresh operation rather than producing multiple refresh calls.
- A successful refresh revokes the previous refresh token, stores a new refresh token, replaces both authentication cookies as needed, and retries each failed request once.
- A failed refresh clears authenticated query data and redirects the user to login.
- Refresh loops are forbidden.

### 8.3 CSRF and CORS

- Backend CORS allows only `http://localhost:3000` for the local profile.
- Credentials are enabled explicitly.
- The backend issues a separate XSRF token that JavaScript may read.
- State-changing requests send the XSRF value in the `X-XSRF-TOKEN` header.
- Spring Security remains responsible for authentication, CSRF enforcement, and role authorization.
- Frontend route guards improve navigation and presentation but are not treated as a security boundary.

### 8.4 SMTP password recovery

- Spring Boot sends reset links through a configurable SMTP server; the frontend never receives SMTP credentials.
- Local development defaults to an SMTP catcher on `localhost:1025`; production supplies its provider settings through environment secrets.
- Reset links target `${FRONTEND_BASE_URL}/reset-password?token=...`.
- Forgot-password responses do not reveal whether an email address exists.
- `.env.example` documents SMTP names only, while `.env` and all real credentials remain ignored by Git.

## 9. TanStack Query behavior

- Query keys are created through typed factories for auth, concerts, ticket types, bookings, users, vouchers, and availability.
- Read queries may retry transient failures with a small bounded retry policy.
- Mutations do not retry automatically.
- Successful mutations invalidate only related query keys.
- Ticket availability and other changing data refetch when the browser regains focus.
- The query cache is cleared when logout succeeds or session refresh fails.
- Errors are normalized from the backend `BaseResponse` before reaching components.

## 10. Critical flows

### 10.1 Guest discovery

```text
Open home or concert list
→ Fetch public concerts
→ Search/filter/page through results
→ Open concert detail
→ Fetch public concert detail and ticket types
```

### 10.2 Login and role routing

```text
Submit shared login form
→ Backend validates credentials
→ Backend sets HttpOnly cookies
→ Frontend requests /auth/me
→ USER goes to the customer area
→ ADMIN goes to /admin
```

### 10.3 Booking

```text
Select ticket quantities
→ Client validates a total of one to four tickets
→ Optionally enter a voucher code
→ Generate an idempotency key for this submission
→ Submit the booking once
→ Backend validates authentication, inventory, voucher, and business rules
→ Display the returned PENDING booking
→ Invalidate booking history and ticket availability
```

The same idempotency key is retained for a manual retry of the same submission. A new booking intent receives a new key. The frontend does not decrement authoritative inventory locally.

The existing backend rules are reflected in the UI:

- Maximum four tickets per booking
- Maximum two pending bookings per user
- Pending booking expiration after fifteen minutes

### 10.4 Authenticated password change

```text
Enter current password, new password, and confirmation
→ Backend verifies the current password
→ Backend validates and stores the new password
→ Backend revokes every stored token for the user
→ Backend clears authentication cookies for the current browser
→ Frontend clears authenticated query data
→ Redirect to login
```

An invalid current password or mismatched confirmation does not change the password or revoke sessions.

### 10.5 Admin booking transition

Approved legal transitions:

```text
PENDING → PAID
PENDING → CANCELLED
PENDING → EXPIRED   (scheduler)
PAID    → CANCELLED
```

`CANCELLED` and `EXPIRED` are terminal. Arbitrary status strings and invalid transitions are rejected by the backend.

### 10.6 Concert image upload

```text
Admin selects an image
→ Frontend validates JPEG, PNG, or WebP and size up to 10 MB
→ Frontend uploads multipart data to Spring Boot
→ Backend validates type and size again
→ Backend uploads to Cloudinary with server-side credentials
→ Backend returns the image URL
→ URL is placed into the concert creation form
→ Admin submits the concert
```

An image upload failure does not create a concert. Cloudinary secrets are never exposed to browser code.

## 11. Backend contract changes

The frontend depends on the following approved backend changes.

### 11.1 Public concert access

- Permit guests to call `GET /api/v1/concerts/list`.
- Add and permit `GET /api/v1/concerts/{id}`.
- Permit guests to call `GET /api/v1/ticket-types/concert/{concertId}`.
- Admin concert endpoints remain restricted to `ADMIN`.

### 11.2 Cookie authentication

- Login sets access and refresh cookies.
- Refresh reads the refresh cookie, validates its stored revocation state, revokes it, issues and stores a new refresh token, and replaces the cookies.
- Logout invalidates stored tokens and clears cookies.
- Protected API authentication reads the access cookie.
- CSRF protection is enabled for state-changing cookie-authenticated requests.

### 11.3 Current user

- Add `GET /api/v1/auth/me`.
- Return current user identity and role without returning authentication tokens.

### 11.4 Authenticated password change

- Add `PUT /api/v1/auth/password` as an authenticated endpoint.
- Accept `currentPassword`, `newPassword`, and `confirmPassword`.
- Verify the current password before changing it.
- Require the new password and confirmation to match and satisfy the password policy.
- Revoke every stored access and refresh token belonging to the user after success.
- Clear the current browser's authentication cookies.
- Require the user to log in again.
- Keep the existing reset-token password flow separate.

### 11.5 User authorization

- Restrict existing user-management endpoints to `ADMIN`.
- Customers obtain only their own account summary through `/api/v1/auth/me`.

### 11.6 Cloudinary upload

- Add an admin-only multipart image upload endpoint.
- Accept only JPEG, PNG, and WebP.
- Reject files larger than 10 MB.
- Keep Cloudinary credentials in backend configuration.
- Return the stored image URL to the caller.

### 11.7 Booking status validation

- Validate status names and legal transitions on the backend.
- Preserve automatic pending expiration.
- Preserve inventory restoration when a booking reaches `CANCELLED` or `EXPIRED` through a legal transition.

### 11.8 Sensitive authentication configuration

- Remove hard-coded JWT secrets from committed configuration.
- Read access, refresh, and reset-token secrets from environment variables.
- Provide documented local environment-variable names without committing secret values.
- Remove logging of authorization headers, access tokens, refresh tokens, reset tokens, cookies, and other credentials.
- Retain only non-sensitive authentication audit context.

## 12. Error handling

- Field validation errors appear next to their fields.
- Business errors appear in a visible alert or toast using safe backend messages.
- `401` enters the single refresh-and-retry flow.
- `403` displays a dedicated forbidden page.
- `404` displays a not-found page.
- Network failures expose a retry action where retry is safe.
- Unexpected failures use a generic message and do not expose server stack traces.
- All primary screens provide loading, empty, success, and error states.
- Mutation buttons disable while the request is in flight to reduce duplicate user actions.

## 13. Data formatting

- Prices and totals are displayed as VND.
- Currency values remain decimal/string values from the API and are never calculated with binary floating-point arithmetic.
- Concert, voucher, and booking times are presented in `Asia/Ho_Chi_Minh`.
- Backend timestamps without an offset are interpreted according to the agreed application timezone until the backend adopts offset-aware timestamps.

## 14. Testing strategy

### 14.1 Frontend unit and component tests

Use Vitest and React Testing Library to test:

- Zod schemas and form behavior
- VND and date-time formatting
- Status badges
- Ticket selection and the four-ticket limit
- API response and error normalization
- Role-aware route guards
- Theme switching
- Loading, empty, and error states

### 14.2 End-to-end tests

Use Playwright for:

1. Guest concert list and detail access.
2. Guest booking attempt redirecting to login.
3. Registration, login, logout, forgotten password, reset password, and change password.
4. Customer booking with multiple ticket types and an optional voucher.
5. Customer booking history and detail.
6. Customer denial from admin routes.
7. Admin login and role redirect.
8. Admin concert creation with Cloudinary image upload.
9. Admin availability, booking, user, and voucher workflows.
10. Legal booking status changes.
11. Mobile, tablet, and desktop layouts.
12. Light and dark theme readability.

### 14.3 Backend tests

- Public and protected concert endpoint authorization
- Admin-only user management
- HttpOnly login cookies
- Refresh-token rotation, old-token revocation, and logout cookie behavior
- CSRF enforcement
- `/auth/me` identity and role
- Authenticated password change with current-password verification and all-session token revocation
- Upload content-type and size validation
- Booking transition validation
- Idempotent duplicate booking submission

## 15. Implementation roadmap

### Phase 1 — Backend contract and security

- Implement and test the approved backend contract changes.

### Phase 2 — Frontend foundation

- Scaffold Next.js with TypeScript and `pnpm`.
- Configure Tailwind CSS, shadcn/ui, themes, TanStack Query, forms, validation, and testing.
- Build the typed API client and authentication/session foundation.
- Build shared layouts and state components.

### Phase 3 — Public and authentication

- Implement public discovery pages and all authentication flows.

### Phase 4 — Customer booking

- Implement ticket selection, booking submission, confirmation, history, detail, and account pages.

### Phase 5 — Admin

- Implement dashboard, concert, booking, user, voucher, and upload workflows.

### Phase 6 — Verification and documentation

- Complete automated tests, responsive and theme QA, production build verification, and local setup documentation.

## 16. Important trade-offs

- HttpOnly cookies reduce token exposure to browser JavaScript but require backend cookie, CORS, and CSRF changes.
- TanStack Query adds a dependency and concepts to learn but removes repeated cache, refetch, loading, and error coordination code.
- Separate repositories keep frontend and backend ownership clear but require API contract changes to be coordinated.
- Omitting WebSockets keeps the local implementation simple. The UI refetches changing data when appropriate, while the backend remains responsible for inventory concurrency.
- Uploading through Spring Boot protects Cloudinary credentials but routes file traffic through the backend.
- Hybrid rendering improves public initial rendering while preserving client interactivity for booking and administration.

## 17. Definition of Done

- Frontend installs and runs with `pnpm`.
- TypeScript validation passes.
- ESLint passes.
- Frontend unit and component tests pass.
- Critical Playwright flows pass.
- Related backend tests pass.
- Production frontend build succeeds.
- No serious browser-console errors remain.
- Mobile, tablet, and desktop layouts are usable.
- Light and dark themes remain readable.
- Every primary screen handles loading, empty, and error states.
- Cookie authentication, CORS, and CSRF work between ports 3000 and 8080.
- No authentication secrets or complete tokens are committed or written to application logs.
- README documents local environment variables and startup steps for both repositories.
