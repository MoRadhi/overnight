# overnight-frontend

React + Vite application for Overnight's public booking experience and admin
operations dashboard.

This app only talks to `overnight-backend`. It does not call
`overnight-analytics` directly.

Last updated: 2026-09-12.

## Role In The Monorepo

This is one of three applications in the `overnight` monorepo (see the
root `README.md` and `ARCHITECTURE.md`). Within it, this app is:

- User-facing and admin-facing UI layer.
- Sends all data requests to backend REST APIs via Axios.
- Displays analytics that are computed by backend + analytics service.

Flow summary:

1. Frontend requests backend endpoint.
2. Backend performs CRUD/business logic (and analytics orchestration if needed).
3. Backend returns response payload consumed by React pages.

## Architecture

### App shell and routing

- Entry point: `src/main.jsx`
- Root app and route definitions: `src/App.jsx`
- Router strategy: BrowserRouter + route groups

Route groups:

- Public layout (navbar + footer):
  - `/`
  - `/hotels/:id`
  - `/hotels/:id/book` (uses query params like `roomTypeId`, `checkIn`, `checkOut`)
- Auth page:
  - `/admin/login`
- Protected admin layout (navbar + auth guard):
  - `/admin/analytics`
  - `/admin/hotels`
  - `/admin/reservations`
  - `/admin/rooms`

### Auth model

- `AuthContext` stores JWT token in localStorage (`overnight_admin_token`).
- `RequireAuth` redirects unauthenticated users to `/admin/login`.
- Axios request interceptor attaches `Authorization: Bearer <token>`.
- Axios response interceptor clears stale token on 401.

### State and data strategy

- Uses local component state with hooks (`useState`, `useEffect`, `useCallback`).
- API access centralized under `src/api/`:
  - `apiClient.js`
  - `auth.js`
  - `hotels.js`
  - `rooms.js`
  - `reservations.js`
  - `analytics.js`

### UI system

- Base stack: React-Bootstrap + custom design system in `src/theme.css`.
- Motion stack: GSAP, Framer Motion, Lenis scroll smoothing, custom reveal hooks.
- Data visualization: Recharts in admin analytics dashboard.

### Image strategy

- Destination cards use a country-level image map in `Home.jsx`.
- Property cards/details resolve images through `src/utils/hotelImages.js`.
- Resolution order is:
  1.  backend `imageUrl` when present and non-placeholder
  2.  property matcher map (known seeded hotels)
  3.  country fallback map
  4.  deterministic local fallback
- This keeps countries and hotels visually distinct while remaining robust if
  upstream records have missing imagery.

## Feature Modules

### Public experience

- `Home.jsx`: destination browse, country filter, curated content sections.
- `HotelDetail.jsx`: hotel details + room type listing.
- `BookingForm.jsx`: booking flow:
  1.  query room availability
  2.  pick room matching selected room type
  3.  create reservation

### Admin experience

- `Login.jsx`: admin authentication.
- `Reservations.jsx`: reservation list and status operations.
- `Hotels.jsx`: hotel CRUD.
- `Rooms.jsx`: room type + room CRUD.
- `Analytics.jsx`: KPI cards and charts for summary, segments, forecast, sentiment.

## API Contract Used By Frontend

### Auth

- `POST /api/auth/login`

### Public hotel browse and booking

- `GET /api/hotels`
- `GET /api/hotels/countries`
- `GET /api/hotels/{id}`
- `GET /api/hotels/{hotelId}/room-types`
- `GET /api/rooms/availability`
- `POST /api/reservations`
- `POST /api/reservations/{id}/review`

### Admin operations

- `GET /api/reservations`
- `PATCH /api/reservations/{id}/status`
- Hotel CRUD endpoints
- Room type CRUD endpoints
- Room CRUD endpoints
- Analytics endpoints:
  - `GET /api/analytics/summary`
  - `GET /api/analytics/segments`
  - `GET /api/analytics/forecast`
  - `GET /api/analytics/sentiment`

## Key Technical Decisions

1. Single backend base URL through one Axios client.
   Reason: centralized auth/header/error behavior.

2. Route-level protection for admin pages.
   Reason: clean separation between public and staff functionality.

3. Keep booking orchestration simple on client.
   Reason: backend remains source of truth for availability and validation.

4. Use reusable API helper modules by domain.
   Reason: clearer maintenance and contract visibility.

## Problems Faced And Implemented Solutions

### Problem 1: Auth token becoming stale

Symptom:

- Admin could remain in broken auth state after token expiry.

Solution:

- Interceptor removes token on 401 so UI can re-auth cleanly.

### Problem 2: CORS failures during local development port changes

Symptom:

- Browser calls failed when Vite moved away from default port.

Solution implemented in backend (consumed by frontend):

- CORS moved to localhost wildcard patterns.

### Problem 3: Booking reliability with room type selection

Challenge:

- User selects a room type, but backend books by concrete room.

Solution:

- Client first fetches available rooms for date range and then selects one room
  of the chosen type before creating reservation.

## Project Structure

```
src/
	api/            # backend API wrappers
	components/     # reusable UI components
	context/        # auth context
	hooks/          # scroll/reveal/tilt behavior
	pages/
		public/       # customer-facing pages
		admin/        # staff dashboard pages
	utils/          # helper utilities (image mapping, etc.)
	App.jsx
	main.jsx
	theme.css
```

## Local Run

```bash
npm install
npm run dev
```

Set backend URL in `.env.local` when needed:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Deployment

- Primary deploy target: Vercel (`vercel.json` contains SPA rewrite rule),
  with the Vercel project's Root Directory set to `overnight-frontend`
  (required since this is a monorepo).
- `public/_redirects` is also present for SPA hosting compatibility.
- Dockerfile is for local/dev containerized runs (not the main production path).

## Dependencies And Why We Chose Them

Core application stack:

- React 19
  Why: component model and ecosystem maturity for complex multi-page UI flows.
- Vite
  Why: fast local startup/HMR and lightweight build pipeline.
- React Router
  Why: clear separation of public vs admin route trees and protected layouts.
- Axios
  Why: centralized API client with interceptors for JWT header injection and
  global 401 handling.

UI and interaction:

- React-Bootstrap + Bootstrap
  Why: fast, consistent admin UI primitives while still allowing custom theme
  styling.
- GSAP + @gsap/react
  Why: fine-grained timeline control for premium motion sequences.
- Framer Motion
  Why: declarative page/component transitions and hover micro-interactions.
- Lenis
  Why: smoother perceived scrolling and better visual continuity across sections.
- Recharts
  Why: reliable charting primitives for analytics KPIs with relatively low
  implementation overhead.

Tooling:

- Oxlint
  Why: fast linting feedback for JSX/JS code quality.

## Current Notes

- Frontend is feature-complete for current public browse + admin operations +
  analytics dashboard scope.
- Backend contract remains the key integration boundary; keeping API wrappers
  up to date is the main maintenance requirement.

## Health Checks And Operational Verification

Frontend availability:

- Local app shell: `GET http://localhost:5173/` (or the port Vite prints).

Backend health from browser:

- Yes, you can check backend health from the browser by opening:
  - `http://localhost:8080/api/ping`
  - `http://localhost:8080/actuator/health`

Analytics health from frontend:

- Not directly via frontend code by design.
- Preferred checks are:
  - direct service URL: `http://localhost:8000/health`
  - indirect via backend analytics endpoint success in admin dashboard.

Practical full-stack check sequence:

1. Open frontend URL and verify pages render.
2. Open backend `/api/ping`.
3. Open analytics `/health`.
4. Log into admin and verify analytics page loads charts/cards without errors.
