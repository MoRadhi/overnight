# Overnight Architecture Summary

This document describes the current architecture across the three sibling repositories in this project.
It is intended as a high-level source of truth for an AI or developer that needs to understand service boundaries, repo structure, and how data flows between the apps.

Last updated: 2026-09-12.

## Root layout

The parent directory contains:

- `.circleci/config.yml` - the single CI pipeline for all three services
  (CircleCI only reads config at the repo root; each service used to have
  its own file when this was three separate repos - see "CI/CD" below).
- `docker-compose.yml` - local dev compose file for PostgreSQL, backend, analytics, and frontend.
- `README.md` - project-level README with repo responsibilities and local run instructions.
- `Deployment.md` - full deployment walkthrough, including monorepo-migration gotchas.
- `overnight-backend/` - Java Spring Boot service.
- `overnight-analytics/` - Python FastAPI microservice.
- `overnight-frontend/` - React/Vite frontend.

## High-level architecture

- `overnight-frontend` is the public web application. It is a React SPA built with Vite.
- `overnight-backend` is the business API and persistence layer. It is a Spring Boot service talking to Postgres and the analytics service.
- `overnight-analytics` is an internal data science microservice. It is a FastAPI app that computes RFM segmentation, sentiment scoring, and occupancy forecasting.

The frontend never calls analytics directly. The frontend only communicates with the backend. The backend may call the analytics service over HTTP/JSON.

### Local development service graph

```
Browser -> overnight-frontend (React/Vite) -> Axios -> overnight-backend (Spring Boot)
                                                          |
                                                          +--> Postgres (db)
                                                          |
                                                          +--> overnight-analytics (FastAPI)
```

Ports in local dev using `docker-compose.yml`:

- `frontend`: 5173
- `backend`: 8080
- `analytics`: 8000
- `db`: 5432

## Root docker-compose

The root `docker-compose.yml` defines four services:

- `db`: Postgres 16 Alpine with DB name `overnight`, user `overnight`, password `overnight`.
- `analytics`: builds from `./overnight-analytics`; exposes `8000`.
- `backend`: builds from `./overnight-backend`; configures `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `ANALYTICS_SERVICE_URL`, `JWT_SECRET`; exposes `8080`.
- `frontend`: builds from `./overnight-frontend`; configures `VITE_API_BASE_URL`; exposes `5173`.

## Repo summaries

### overnight-backend

Stack

- Java 21
- Spring Boot 3.5
- Spring Web, Spring Data JPA, Spring Security, Spring Validation, Spring Actuator
- PostgreSQL JDBC driver
- JSON Web Tokens via `jjwt`

Key files and directories

- `.github/workflows/supabase-keepalive.yml`
- `.dockerignore`
- `.gitignore`
- `Dockerfile`
- `pom.xml`
- `README.md`
- `render.yaml`
- `src/main/resources/application.yml`
- `src/test/resources/application-test.yml`

Main source structure

- `src/main/java/com/overnight/backend/`
  - `OvernightBackendApplication.java` - Spring Boot entrypoint.
  - `config/`
    - `ApplicationConfig.java`
    - `CorsConfig.java`
    - `DataSeeder.java`
    - `RestClientConfig.java`
    - `SecurityConfig.java`
  - `controller/`
    - `AnalyticsController.java`
    - `AuthController.java`
    - `GuestController.java`
    - `HotelController.java`
    - `PingController.java`
    - `ReservationController.java`
    - `RoomController.java`
    - `RoomTypeController.java`
  - `dto/`
    - `AnalyticsSummaryResponse.java`
    - `AuthRequest.java`
    - `AuthResponse.java`
    - `ForecastPoint.java`
    - `GuestResponse.java`
    - `GuestSegmentData.java`
    - `GuestSegmentResponse.java`
    - `HotelRequest.java`
    - `HotelResponse.java`
    - `OccupancyPoint.java`
    - `ReservationRequest.java`
    - `ReservationResponse.java`
    - `RevenueDataPoint.java`
    - `ReviewRequest.java`
    - `ReviewResponse.java`
    - `RfmRecord.java`
    - `RoomRequest.java`
    - `RoomResponse.java`
    - `RoomTypeRequest.java`
    - `RoomTypeResponse.java`
    - `SentimentResultData.java`
    - `SentimentTrendPoint.java`
    - `StatusUpdateRequest.java`
  - `entity/`
    - `Admin.java`
    - `Guest.java`
    - `Hotel.java`
    - `Reservation.java`
    - `ReservationStatus.java`
    - `Review.java`
    - `Room.java`
    - `RoomStatus.java`
    - `RoomType.java`
    - `SentimentLabel.java`
  - `exception/`
    - `BadRequestException.java`
    - `ConflictException.java`
    - `GlobalExceptionHandler.java`
    - `ResourceNotFoundException.java`
  - `repository/`
    - `AdminRepository.java`
    - `GuestRepository.java`
    - `HotelRepository.java`
    - `ReservationRepository.java`
    - `ReviewRepository.java`
    - `RoomRepository.java`
    - `RoomTypeRepository.java`
  - `security/`
    - `AdminUserDetailsService.java`
    - `JwtAuthenticationFilter.java`
    - `JwtService.java`
  - `service/`
    - `AnalyticsClient.java`
    - `AnalyticsService.java`
    - `AvailabilityService.java`
    - `GuestService.java`
    - `HotelService.java`
    - `ReservationService.java`
    - `ReviewService.java`
    - `RoomService.java`
    - `RoomTypeService.java`
  - `dto`, `entity`, `exception`, `repository`, `security`, and `service` folders are all under the `com.overnight.backend` package.
  - `src/main/resources/application.yml` contains environment-driven Spring Boot configuration.
  - `src/test/java/com/overnight/backend/`
    - `AvailabilityServiceTest.java`
    - `OvernightBackendApplicationTests.java`
    - `ReservationServiceTest.java`
  - `src/test/resources/application-test.yml` contains test datasource overrides.

Backend responsibilities

- Exposes REST API controllers under `/api/*`.
- Manages hotel, room type, room, guest, reservation, review, and admin data.
- Handles authentication via JWT.
- Provides analytics summary, guest segments, occupancy forecast, and sentiment trend endpoints.
- Calls the internal analytics service when needed:
  - `/internal/rfm`
  - `/internal/sentiment`
  - `/internal/forecast`

Important backend behavior

- `AnalyticsClient` is a Spring service that wraps HTTP calls to `overnight-analytics`.
- It catches analytics failures and returns empty results instead of failing the main API.
- `SecurityConfig` enforces JWT auth for admin/analytics routes while keeping
  public browse and booking routes open; a `disable-auth` switch exists for
  controlled local scenarios.
- `application.yml` reads DB and analytics URLs, JWT secret, and port from environment variables.
- Every list-returning repository query (`HotelRepository`,
  `RoomRepository`, `RoomTypeRepository`, `ReservationRepository`,
  `GuestRepository`) explicitly orders by `id`. Postgres does not
  guarantee row order without `ORDER BY`, and an `UPDATE` can relocate a
  row's physical position in an unordered scan - without explicit
  ordering, editing a hotel/room/reservation could shift its position in
  the next fetch, making admins believe their edit never persisted when
  it actually had (it just showed up in a different row than expected).

Public browse endpoints used by frontend home and detail pages

- `GET /api/hotels` (supports `?country=` filter)
- `GET /api/hotels/countries`
- `GET /api/hotels/{id}`
- `GET /api/hotels/{hotelId}/room-types`
- `GET /api/rooms/availability`

### overnight-frontend

Stack

- React 19
- Vite 8
- React Router DOM 7
- Axios
- Bootstrap 5 + React-Bootstrap
- Recharts

Key files and directories

- `.gitignore`
- `.env.local`
- `.oxlintrc.json`
- `Dockerfile`
- `index.html`
- `package.json`
- `package-lock.json`
- `README.md`
- `vercel.json`
- `vite.config.js`

Main source structure

- `src/api/`
  - `analytics.js`
  - `apiClient.js`
  - `auth.js`
  - `hotels.js`
  - `reservations.js`
  - `rooms.js`
- `src/components/`
  - `AppNavbar.jsx`
  - `AvailabilitySearch.jsx`
  - `ConfirmModal.jsx`
  - `HotelCard.jsx`
  - `RequireAuth.jsx`
  - `RoomTypeCard.jsx`
  - `StatusBadge.jsx`
- `src/context/`
  - `AuthContext.jsx`
- `src/hooks/`
  - `useKeyedCache.js` - per-key in-memory cache shared by the admin
    Analytics/Reservations/Rooms pages (see "Frontend admin caching" below)
  - `useLenis.js`, `useReveal.js`, `useTilt.js`
- `src/pages/admin/`
  - `Analytics.jsx`
  - `Hotels.jsx`
  - `Login.jsx`
  - `Reservations.jsx`
  - `Rooms.jsx`
- `src/pages/public/`
  - `BookingForm.jsx`
  - `Home.jsx`
  - `HotelDetail.jsx`
- `src/App.jsx`
- `src/main.jsx`
- `src/theme.css`

This repo is a single-page React application built with Vite. The `src/api` files wrap backend Axios calls, the `src/components` files contain reusable UI widgets, `src/context/AuthContext.jsx` manages authentication state, and `src/pages` contains both admin dashboard and customer-facing pages.

Frontend responsibilities

- Provides the public hotel booking experience and the admin analytics dashboard.
- Uses Axios to call the backend API only.
- Contains an auth context for admin sign-in and protected admin routes.
- Hosts a working public booking flow and admin operations dashboard, including
  CRUD management and analytics views.

Frontend admin caching

- `src/hooks/useKeyedCache.js` gives each admin page a per-filter-key
  in-memory cache. Analytics (hotel filter), Reservations (hotel filter),
  and Rooms (hotel -> room types -> rooms drill-down) all re-fetched from
  the backend on every filter change, even when switching back to a
  filter viewed seconds earlier. Switching back now reuses the cached
  result with no network call.
- Every create/update/delete/status-change invalidates or refreshes the
  affected cache entry so a mutation is always reflected immediately -
  caching must never mask a real write.

Frontend image strategy

- Hotel cards and detail pages resolve imagery via `src/utils/hotelImages.js`.
- Priority order:
  1. `hotel.imageUrl` from backend (if not a known placeholder host)
  2. Name/city/country matcher map for known properties
  3. Country fallback image map
  4. Deterministic hashed local fallback
- This keeps each country and seeded hotel visually distinct while preserving
  resilience when upstream data is missing an image URL.

### overnight-analytics

Stack

- Python 3
- FastAPI
- Uvicorn
- pandas
- numpy
- scikit-learn
- statsmodels
- vaderSentiment
- pydantic
- pytest

Key files and directories

- `.dockerignore`
- `.gitignore`
- `Dockerfile`
- `README.md`
- `render.yaml`
- `requirements.txt`

Main source structure

- `app/`
  - `__init__.py`
  - `main.py`
  - `models/`
    - `__init__.py`
    - `schemas.py`
  - `routers/`
    - `__init__.py`
    - `forecast.py`
    - `rfm.py`
    - `sentiment.py`
  - `services/`
    - `__init__.py`
    - `forecast_service.py`
    - `rfm_service.py`
    - `sentiment_service.py`
- `tests/`
  - `__init__.py`
  - `test_health.py`
  - `test_rfm_service.py`
  - `test_sentiment_service.py`
  - `test_forecast_service.py`

This repo is a Python FastAPI microservice. `app/main.py` wires together routers, `app/models/schemas.py` defines request/response models, and `app/services` contains the computation logic for forecasting, RFM segmentation, and sentiment scoring.

Analytics responsibilities

- Hosts internal-only endpoints for the backend to consume.
- Computes guest RFM segmentation from reservation history.
- Scores review sentiment.
- Forecasts occupancy from historical occupancy data.
- Exposes `GET /health` for health checks.

Important analytics endpoints

- `GET /health`
- `POST /internal/rfm`
- `POST /internal/sentiment`
- `POST /internal/forecast`

## Current service relationships

- `overnight-frontend` reads `VITE_API_BASE_URL` and sends requests to `overnight-backend`.
- `overnight-backend` reads `ANALYTICS_SERVICE_URL` and sends internal analytics requests to `overnight-analytics`.
- `overnight-backend` reads `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` to connect to PostgreSQL.

## Notes for AI context

- This repo set is intentionally polyglot: frontend in JavaScript/React, backend in Java/Spring Boot, analytics in Python/FastAPI.
- The core integration point is `overnight-backend`.
- `overnight-analytics` is internal and should not be exposed directly to customers in the current architecture.
- Root-level docs already capture project vision and current state; this file focuses on file and service structure.
