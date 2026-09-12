# overnight-backend

Spring Boot service that acts as Overnight's API gateway and business layer.

It sits between:

- `overnight-frontend` (public/admin web app)
- PostgreSQL (source-of-truth operational data)
- `overnight-analytics` (internal compute service)

Last updated: 2026-09-12.

## Role In The Monorepo

This is one of three applications in the `overnight` monorepo (see the
root `README.md` and `ARCHITECTURE.md`). Within it, this service is the
central orchestrator:

1. Exposes all public/admin REST endpoints used by frontend.
2. Enforces auth/authorization and CORS policies.
3. Owns booking business rules and persistence.
4. Delegates analytics computation to `overnight-analytics`.
5. Returns analytics data in frontend-ready contracts.

## Architecture

### Layered structure

```
src/main/java/com/overnight/backend/
  controller/   # HTTP API layer
  service/      # business logic + analytics orchestration
  repository/   # Spring Data JPA persistence
  entity/       # JPA domain model
  dto/          # request/response contracts
  security/     # JWT + user details + request filter
  config/       # security, CORS, RestClient, app wiring, data seeding
  exception/    # domain exceptions + ProblemDetail handler
```

### Request lifecycle

1. Request enters controller.
2. Validation and auth are applied.
3. Service executes domain logic and repository access.
4. Optional analytics call is made via `AnalyticsClient`.
5. DTO response is returned.

## API Surface

### Public endpoints

- `GET /api/ping`
- `GET /api/hotels`
- `GET /api/hotels/countries`
- `GET /api/hotels/{id}`
- `GET /api/hotels/{hotelId}/room-types`
- `GET /api/room-types/{id}`
- `GET /api/room-types/{roomTypeId}/rooms`
- `GET /api/hotels/{hotelId}/rooms`
- `GET /api/rooms/availability?hotelId=&checkIn=&checkOut=`
- `GET /api/rooms/{id}`
- `POST /api/reservations`
- `POST /api/reservations/{id}/review`
- `POST /api/auth/login`

Hotel and room type payloads include optional `imageUrl` fields used by the
frontend for country/property-specific visuals.

### Protected admin endpoints

- `GET /api/reservations`
- `GET /api/reservations/{id}`
- `PATCH /api/reservations/{id}/status`
- Hotel CRUD: `POST|PUT|DELETE /api/hotels...`
- Room type CRUD: `POST|PUT|DELETE /api/room-types...`
- Room CRUD: `POST|PUT|DELETE /api/rooms...`
- `GET /api/guests`
- `GET /api/guests/{id}`
- `GET /api/guests/{id}/reservations`
- Analytics:
  - `GET /api/analytics/summary`
  - `GET /api/analytics/segments`
  - `GET /api/analytics/sentiment`
  - `GET /api/analytics/forecast?hotelId=`

## Core Business Logic

### Booking flow (`ReservationService#create`)

1. Validates `checkIn < checkOut`.
2. Resolves room and rejects maintenance rooms.
3. Confirms no overlap through `AvailabilityService`.
4. Finds-or-creates guest by email (`GuestService`).
5. Computes total price from room type base rate x nights.
6. Saves reservation as `BOOKED`.

### Availability logic (`AvailabilityService`)

Uses half-open date overlap semantics:

- Existing `[A, B)` overlaps requested `[C, D)` when `A < D && B > C`.
- Cancelled reservations do not block availability.
- Only rooms with `RoomStatus.AVAILABLE` are returned.

### Reservation status transitions (`ReservationService#updateStatus`)

Allowed:

- `BOOKED -> CHECKED_IN`
- `CHECKED_IN -> CHECKED_OUT`
- `BOOKED -> CANCELLED`
- `CHECKED_IN -> CANCELLED`

Blocked:

- Any transition from terminal states (`CHECKED_OUT`, `CANCELLED`)
- Reverting to `BOOKED`
- `BOOKED -> CHECKED_OUT` direct jump

### Review + sentiment flow (`ReviewService#create`)

1. Allows review only for `CHECKED_OUT` reservations.
2. Enforces one review per reservation.
3. Saves review immediately.
4. Calls analytics sentiment endpoint.
5. If analytics is unavailable, keeps review saved with nullable sentiment
   fields (graceful degradation).

## Analytics Integration

### Role split

- Backend computes and prepares data context (completed reservations, occupancy
  history, review lists).
- Analytics service computes RFM/sentiment/forecast outputs.

### Integration implementation

- `AnalyticsService` builds payload sources from DB and maps outputs.
- `AnalyticsClient` calls:
  - `POST /internal/rfm`
  - `POST /internal/sentiment`
  - `POST /internal/forecast`
- Forecast uses 60-day occupancy history and requests a 14-day horizon.

## Security Model

- JWT bearer tokens for admin auth.
- Login endpoint: `POST /api/auth/login`.
- `JwtAuthenticationFilter` sets security context when valid token exists.
- `SecurityConfig` keeps public browse/booking routes open and protects admin
  CRUD + analytics.
- Optional auth disable switch exists for controlled scenarios:
  `overnight.security.disable-auth`.

## Error Handling

- Centralized `GlobalExceptionHandler` returns `ProblemDetail` JSON payloads.
- Maps domain exceptions to 400/401/404/409/422/500 consistently.

## Data And Seeding Strategy

- `DataSeeder` bootstraps realistic multi-country demo data when DB is empty.
- Seeds:
  - admin account (`admin` / `overnight2024`)
  - hotels, room types, rooms
  - guests, reservations across lifecycle states
  - pre-scored reviews for immediate analytics visualization
- Disabled under `test` profile.

## Key Technical Decisions

1. Backend as single external API boundary.
   Reason: frontend and analytics remain decoupled.

2. Graceful analytics failures.
   Reason: booking/review workflows should not hard-fail when analytics is down.

3. Explicit transition rules in reservation lifecycle.
   Reason: prevent impossible operational states.

4. JSON-first error responses from security layer.
   Reason: frontend consumes API errors reliably without HTML fallback pages.

## Problems Faced And Implemented Solutions

### Problem 1: CORS failures when frontend changed dev ports

Symptoms:

- Browser preflight failures on `localhost:5174`.

Solution:

- Moved to wildcard localhost origin patterns in `CorsConfig`:
  - `http://localhost:*`
  - `http://127.0.0.1:*`
- Added deployed Vercel patterns.

### Problem 2: Analytics 422 "missing body"

Symptoms:

- Backend analytics requests returned 422 from FastAPI.

Solutions:

- Use explicit object payloads for analytics requests.
- Force backend analytics transport to HTTP/1.1 (`RestClientConfig`).
- Keep injected Spring `RestClient.Builder` so shared Jackson config applies.

### Problem 3: Regression test drift after payload refactor

Symptoms:

- Build/test failures in analytics client tests.

Solution:

- Updated tests to validate current snake_case payload expectations.

## Dependencies And Why We Chose Them

Core runtime stack:

- Spring Boot Web
  Why: stable and widely adopted REST foundation with strong ecosystem support.
- Spring Data JPA
  Why: rapid repository development, transactional patterns, and clean mapping
  between domain entities and PostgreSQL.
- Spring Validation
  Why: declarative request validation at DTO boundaries with consistent error
  responses.
- Spring Security
  Why: robust authentication/authorization pipeline for admin-protected routes.
- Spring Actuator
  Why: production-ready health and runtime visibility endpoints.

Security and auth:

- JJWT (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`)
  Why: explicit JWT control (signing, verification, expiration) without adding
  OAuth server complexity to the current architecture.

Data stores and drivers:

- PostgreSQL driver
  Why: production database target (including Supabase-hosted PostgreSQL).
- H2 (test scope)
  Why: fast in-memory test runs for service/repository behavior.

Testing:

- Spring Boot Test
  Why: integrated test harness for service and web layers.
- Spring Security Test
  Why: accurate testing of auth/security behavior.

Why this mix was chosen overall:

- It balances development speed with strong conventions.
- It keeps business logic centralized in one service boundary.
- It supports clean integration with the separate analytics microservice.

## Configuration

Environment variables:

| Variable                 | Purpose                           | Default                                      |
| ------------------------ | --------------------------------- | -------------------------------------------- |
| `DB_URL`                 | JDBC URL                          | `jdbc:postgresql://localhost:5432/overnight` |
| `DB_USERNAME`            | DB username                       | `overnight`                                  |
| `DB_PASSWORD`            | DB password                       | `overnight`                                  |
| `PORT`                   | HTTP port                         | `8080`                                       |
| `ANALYTICS_SERVICE_URL`  | Base URL for analytics service    | `http://localhost:8000`                      |
| `JWT_SECRET`             | JWT signing secret (min 32 chars) | dev placeholder                              |
| `JWT_EXPIRATION_MINUTES` | Token TTL in minutes              | `120`                                        |

## Health Checks And Operational Verification

Local URLs (default port 8080):

- API ping: `GET http://localhost:8080/api/ping`
- Actuator health: `GET http://localhost:8080/actuator/health`

Deployed (Render):

- Health check path configured as `/actuator/health` in `render.yaml`.

Analytics connectivity quick-check:

- If backend is healthy but analytics views fail, call a protected analytics
  endpoint (with admin JWT) such as `/api/analytics/summary`.
- A healthy backend with empty analytics payload can indicate analytics-service
  downtime or unreachable `ANALYTICS_SERVICE_URL`.

## Run And Test

Run locally:

```bash
mvn spring-boot:run
```

Run tests:

```bash
mvn test
```

Build Docker image:

```bash
docker build -t overnight-backend .
```

## Deployment

- Docker multi-stage build (Maven build + Temurin JRE runtime).
- Render deployment via `render.yaml`, with the Render project's Root
  Directory set to `overnight-backend` (required since this is a monorepo).
- Health endpoint: `/actuator/health`.
- Production DB expected to be Supabase/PostgreSQL.

## Current Notes

- This service is currently the primary source of product business logic.
- Frontend and analytics can evolve independently as long as contracts remain
  stable.
