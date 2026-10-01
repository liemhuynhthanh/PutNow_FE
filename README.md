# PutNow Frontend

Responsive concert-ticket application built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, and Zod.

## Included flows

- Server-rendered guest concert list, URL-based filters, and concert details with ticket availability
- Shared login with role-aware redirect
- Registration, SMTP password recovery, and single-use reset links
- Customer ticket selection (1–4 tickets), vouchers, booking history/detail, account, and password change
- Admin overview, Cloudinary concert-image upload, availability, booking transitions, users, and vouchers
- Cookie authentication, CSRF, one shared refresh request, dark mode, English UI, VND, and Vietnam time

## Local setup

Requirements: Node.js 20+ and pnpm 11 through Corepack.

The recommended full-stack workflow uses the shared parent Compose file:

```powershell
Set-Location "D:\Booking Platform"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\init-env.ps1
docker compose up --build --detach --wait
docker compose ps
```

Open the frontend at `http://localhost:5000`. The backend is available at `http://localhost:8080`, PostgreSQL at `localhost:6000`, and the Mailpit inbox at `http://localhost:8025`. See [`../DOCKER.md`](../DOCKER.md) for operations and safety notes.

To run only the frontend directly on the host:

```powershell
Copy-Item .env.example .env.local
corepack pnpm install
corepack pnpm dev
```

Start the Spring Boot API on `http://localhost:8080`, then open `http://localhost:5000`.

```dotenv
# Read only by Next.js Server Components.
API_BASE_URL=http://localhost:8080/api/v1

# Used by credentialed requests in the browser.
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

No JWT, SMTP, database, or Cloudinary secret belongs in this repository.

## Data architecture

- Public pages fetch directly from the API in Server Components.
- Authenticated session, booking, account, and admin state use TanStack Query in the browser.
- Browser mutations first obtain a CSRF token and send backend cookies with `credentials: include`.
- The API client permits one refresh retry and deduplicates simultaneous refresh requests.

## Verification

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## Repository layout

- `src/app` — App Router pages, layouts, loading, and error states
- `src/components` — shared and shadcn/ui components
- `src/features` — authentication, concerts, bookings, and admin UI/API modules
- `src/lib` — server/browser API clients and formatting
- `src/types` — API v1 resource, pagination, and Problem Detail types
- `docs/superpowers` — approved design and implementation plan

## Production

Set both API URL variables to the public HTTPS backend URL. Set the backend `FRONTEND_BASE_URL` to this frontend’s exact HTTPS origin, `COOKIE_SECURE=true`, and `COOKIE_SAME_SITE=None` only when the two production sites are cross-site. The repositories deploy independently.
