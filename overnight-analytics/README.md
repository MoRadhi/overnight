# overnight-analytics

Internal FastAPI microservice for Overnight's analytics workloads.

This service is not user-facing. It is called by `overnight-backend` over
server-to-server HTTP and powers:

- RFM guest segmentation
- Review sentiment scoring
- Occupancy forecasting

Last updated: 2026-09-12.

## Role In The Monorepo

This is one of three applications in the `overnight` monorepo (see the
root `README.md` and `ARCHITECTURE.md`). Within it:

- `overnight-frontend` never calls this service directly.
- `overnight-backend` orchestrates data from PostgreSQL, sends compact payloads
  to this service, and returns analytics results to the frontend.
- This service stays stateless and computation-focused.

## Architecture

### High-level flow

1. FastAPI receives internal request payloads at `/internal/*`.
2. Pydantic schemas normalize key naming (camelCase or snake_case payloads).
3. Router delegates to a pure service function.
4. Service returns typed result models.

### Module structure

```
app/
	main.py                 # FastAPI app wiring + /health
	models/schemas.py       # Pydantic contracts + payload normalization
	routers/
		rfm.py                # POST /internal/rfm
		sentiment.py          # POST /internal/sentiment
		forecast.py           # POST /internal/forecast
	services/
		rfm_service.py        # Rule-based RFM scoring + segments
		sentiment_service.py  # VADER sentiment scoring
		forecast_service.py   # Linear regression + fallback projection
tests/
	test_api_contract.py
	test_rfm_service.py
	test_sentiment_service.py
	test_forecast_service.py
	test_health.py
```

## Endpoint Contract

All endpoints are internal.

| Method | Path                | Purpose                                          |
| ------ | ------------------- | ------------------------------------------------ |
| GET    | /health             | Service health check                             |
| POST   | /internal/rfm       | Compute RFM segments from completed reservations |
| POST   | /internal/sentiment | Score review comments (compound + label)         |
| POST   | /internal/forecast  | Produce short-horizon occupancy forecast         |

## Core Logic

### 1) RFM segmentation (`app/services/rfm_service.py`)

- Uses pandas to aggregate by `guest_id`:
  - recency: days since last checkout
  - frequency: number of completed stays
  - monetary: total spend
- Uses fixed threshold scoring for small/medium datasets (instead of strict
  quantiles that can be unstable with sparse data).
- Maps score combinations to business segments:
  - `Champions`, `Loyal`, `Potential Loyalist`, `At Risk`, `New`, `Lost`

### 2) Sentiment scoring (`app/services/sentiment_service.py`)

- Uses VADER (`vaderSentiment`) for short review text.
- Computes compound score and maps to labels:
  - `POSITIVE` if >= 0.05
  - `NEGATIVE` if <= -0.05
  - `NEUTRAL` otherwise

### 3) Forecasting (`app/services/forecast_service.py`)

- Converts occupancy history into occupancy rate:
  $occupancy\_rate = occupied\_rooms / total\_rooms$
- If enough history exists (>= 7 points), fits scikit-learn `LinearRegression`.
- If history is sparse, falls back to a recent moving-average flat projection.
- Output is clamped to [0.0, 1.0].

## Key Technical Decisions

1. Keep this service internal-only and unauthenticated.
   Reason: auth and access control live in the backend gateway.

2. Normalize payload keys in one place (`NormalizedModel`).
   Reason: backend/frontend evolution can mix camelCase and snake_case safely.

3. Use lightweight, deterministic algorithms for now.
   Reason: predictable behavior and fast compute for current product stage.

4. Keep service stateless.
   Reason: simple scaling and easier operational debugging.

## Problems Faced And Solutions

### Problem 1: 422 "missing body" during backend integration

Symptoms:

- `POST /internal/rfm` and `POST /internal/forecast` returned 422.
- Uvicorn logged unsupported/invalid request warnings.

Solution implemented in backend:

- Send explicit JSON objects with expected shape.
- Force backend analytics `RestClient` transport to HTTP/1.1.

Result:

- Stable 200 responses for analytics calls through backend.

### Problem 2: Contract drift risk across services

Solution:

- Added API contract tests that verify camelCase input is accepted and returned
  payload structure is stable.

## Testing

Run:

```bash
pytest tests/ -v
```

Coverage currently includes:

- health endpoint behavior
- service-level RFM/sentiment/forecast behavior
- API contract normalization behavior (camelCase payload compatibility)

## Local Run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Swagger UI:

- `http://localhost:8000/docs`

## Deployment

- Dockerized with `python:3.12-slim`.
- Render deployment config in `render.yaml` with `/health` health check,
  root directory set to `overnight-analytics` in the Render project.
- Build/test/Snyk-scan job runs from the shared root `.circleci/config.yml`
  (one pipeline for all three services - CircleCI only reads config at
  the repo root).

Build image:

```bash
docker build -t overnight-analytics .
```

## Dependencies And Why We Chose Them

Runtime libraries:

- FastAPI
  Why: very fast API development, strong type-hint integration, and automatic
  OpenAPI docs for internal contract debugging.
- Uvicorn
  Why: lightweight ASGI server with excellent FastAPI compatibility and good
  performance for stateless JSON workloads.
- Pydantic v2
  Why: strict schema validation plus model-level normalization hooks (used here
  to accept camelCase and snake_case payloads safely).
- pandas
  Why: concise and reliable tabular aggregation for RFM calculations.
- numpy
  Why: numerical operations and clipping for forecast output bounds.
- scikit-learn
  Why: dependable, battle-tested implementation of linear regression for
  short-horizon trend projection.
- vaderSentiment
  Why: practical lexicon/rule-based sentiment scoring that works well on short
  review text without a custom training pipeline.

Supporting libraries:

- python-dotenv
  Why: predictable local environment variable loading.

Testing libraries:

- pytest
  Why: compact test authoring and fast feedback loops.
- httpx
  Why: modern HTTP client used by FastAPI testing stack.

Notes:

- `statsmodels` is currently listed in `requirements.txt` but not used in the
  implemented forecast path. It can be removed later if we decide to keep the
  forecasting stack strictly to scikit-learn.

## Health Checks And Operational Verification

Local URLs (when running on port 8000):

- Service health: `GET http://localhost:8000/health`
- API docs: `GET http://localhost:8000/docs`

Deployed (Render):

- Health check path configured as `/health` in `render.yaml`.

Important architecture note:

- This service is internal and should not be called from browser frontend code.
- In the full stack, health is normally checked either directly (ops/admin) or
  indirectly via backend analytics endpoint behavior.

## Current Constraints And Notes

- This is a short-horizon analytics engine, not a full forecasting platform.
- No persistence by design; source-of-truth data remains in backend DB.
- This service should remain private behind backend/network controls.
