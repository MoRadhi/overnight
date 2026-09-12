# Overnight — Deployment Guide

Complete step-by-step walkthrough for getting all three services live.
Follow the steps **in order** — each stage produces a URL the next one needs.

> **Monorepo note (2026-09-12):** the project was originally three separate
> GitHub repos (`overnight-backend`, `overnight-analytics`,
> `overnight-frontend`), each independently connected to Render/Vercel/
> CircleCI. It has since been merged into this single repo
> (`github.com/MoRadhi/overnight`). The old repos are now **archived** on
> GitHub — kept for history, no longer deployed from. The steps below
> reflect the monorepo setup; see "Monorepo migration gotchas" at the
> bottom for the specific things that broke during that migration and how
> they were fixed, in case a future re-migration hits the same issues.

---

## Accounts you need first

| Service           | URL                      | Purpose                           |
| ----------------- | ------------------------ | --------------------------------- |
| Supabase          | supabase.com             | Hosted PostgreSQL                 |
| Render            | render.com               | Backend + analytics hosting       |
| Vercel or Netlify | vercel.com / netlify.com | Frontend hosting                  |
| CircleCI          | circleci.com             | CI pipelines                      |
| Snyk              | snyk.io                  | Dependency vulnerability scanning |
| UptimeRobot       | uptimerobot.com          | Health monitoring                 |
| GitHub            | github.com               | Source repos                      |

---

## Step 1 — Push the monorepo to GitHub

Everything lives in one **public** repo now (free CircleCI + Snyk require
public repos unless you pay):

```bash
git remote add origin https://github.com/YOUR_USERNAME/overnight.git
git push -u origin main
```

Each service still keeps its own `Dockerfile` and `render.yaml` in its
subfolder (`overnight-backend/`, `overnight-analytics/`,
`overnight-frontend/`) — Render and Vercel are each told which subfolder
to build from via their own "Root Directory" project setting (Steps 3-5).

---

## Step 2 — Supabase (database)

1. Go to **supabase.com** → New project.
2. Choose a name (e.g., `overnight`), set a strong password, pick a region close to you.
3. Wait ~2 min for provisioning.
4. Go to **Settings → Database → Connection string → URI** tab.
5. Copy the **URI** — it looks like:
   ```
   postgresql://postgres.PROJECTREF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
   ```
6. Convert it to JDBC format for Spring Boot:
   ```
   jdbc:postgresql://aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   ```
7. Note down:
   - `DB_URL` — the JDBC string above
   - `DB_USERNAME` — `postgres.PROJECTREF` (from the URI)
   - `DB_PASSWORD` — the password you set

> Hibernate's `ddl-auto: update` will create all tables automatically
> on the backend's first startup — no migration scripts needed.

### GitHub secrets for the keep-alive action

In the **overnight-backend** GitHub repo → Settings → Secrets and variables → Actions:

| Secret              | Where to find it                                                           |
| ------------------- | -------------------------------------------------------------------------- |
| `SUPABASE_URL`      | Supabase: Settings → API → Project URL (e.g., `https://xxxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Supabase: Settings → API → Project API keys → **anon public**              |

---

## Step 3 — Deploy overnight-analytics to Render

Deploy the analytics service first so its URL is ready for the backend.

1. Go to **render.com** → New → Web Service.
2. Connect your GitHub account and select the `overnight` monorepo.
3. Settings:
   - **Name:** `overnight-analytics`
   - **Root Directory:** `overnight-analytics` (required in the monorepo —
     without this Render tries to build from the repo root and fails)
   - **Runtime:** Docker
   - **Branch:** `main`
   - No environment variables needed for this service.
4. Click **Create Web Service**.
5. Wait for the first deploy to finish (~3–5 min).
6. Copy the actual service URL from the Render dashboard. It is **not
   guaranteed** to be exactly `https://overnight-analytics.onrender.com` —
   if that slug is already taken (e.g. after a service was recreated),
   Render appends a random suffix like `-9820`. Always copy the real URL
   from the dashboard rather than assuming the plain name.
7. Confirm it's alive: `curl <your-service-url>/health`

---

## Step 4 — Deploy overnight-backend to Render

1. Go to **render.com** → New → Web Service.
2. Select the same `overnight` monorepo.
3. Settings:
   - **Name:** `overnight-backend`
   - **Root Directory:** `overnight-backend` (required in the monorepo)
   - **Runtime:** Docker
   - **Branch:** `main`
4. Under **Environment Variables**, add:

   | Key                      | Value                                                         |
   | ------------------------ | ------------------------------------------------------------- |
   | `DB_URL`                 | JDBC string from Step 2                                       |
   | `DB_USERNAME`            | from Step 2                                                   |
   | `DB_PASSWORD`            | from Step 2                                                   |
   | `JWT_SECRET`             | Generate: `openssl rand -hex 32` (any 32+ char random string) |
   | `ANALYTICS_SERVICE_URL`  | the real analytics URL copied in Step 3 (may have a suffix)   |
   | `JWT_EXPIRATION_MINUTES` | `120`                                                         |

5. Click **Create Web Service**.
6. Watch the deploy logs — you should see a line like:
   ```
   ✓ Overnight seed data loaded — 24 hotels, N room types, N rooms, N guests, N reservations, N reviews
   ```
   This confirms the DB tables were created and seeded (exact counts come
   from `DataSeeder.java` and will grow if more seed data is added later).
7. Copy the **real** service URL from the dashboard (same caveat as Step 3
   — it may not be the plain `overnight-backend.onrender.com`) and test it:
   `curl <your-service-url>/api/hotels`

> **Render free tier cold-start:** The service sleeps after 15 min of inactivity
> and takes ~30–60s to wake up on the next request.
> **Before any demo**, hit the URL manually and wait for it to wake.

---

## Step 5 — Deploy overnight-frontend to Vercel

1. Go to **vercel.com** → Add New → Project.
2. Import the `overnight` monorepo from GitHub.
   - If Vercel can't see the repo at all (or a later `git connect` fails
     with something like `The specified Root Directory "overnight-frontend"
     does not exist`), the Vercel GitHub App most likely doesn't have
     access to this repo yet — GitHub Apps installed with "only selected
     repositories" need each new repo added explicitly. Fix at
     **github.com/settings/installations** → Vercel → Configure →
     grant access to `overnight` (or switch to "All repositories").
3. Settings:
   - **Root Directory:** `overnight-frontend` (required in the monorepo —
     Project Settings → General → Root Directory if setting it after the
     fact)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:

   | Key                 | Value                                             |
   | ------------------- | -------------------------------------------------- |
   | `VITE_API_BASE_URL` | the real backend URL copied in Step 4 (may have a suffix) |

5. Click **Deploy**.
6. Your frontend URL will be something like `https://overnight-abc123.vercel.app`.

**If using Netlify instead:**

1. New site → Import from Git → select `overnight-frontend`.
2. Build command: `npm run build`, publish dir: `dist`.
3. Add `VITE_API_BASE_URL` under Site settings → Environment variables.
4. The `public/_redirects` file already handles SPA routing.

---

## Step 6 — Update CORS (important!)

Once you have your actual frontend URL, update `CorsConfig.java` to include it
explicitly alongside the wildcard patterns, then push to trigger a redeploy:

```java
config.setAllowedOriginPatterns(List.of(
    "http://localhost:5173",
    "https://YOUR-ACTUAL-APP.vercel.app",  // add your real URL
    "https://*.vercel.app",
    "https://*.netlify.app"
));
```

---

## Step 7 — CircleCI (CI pipeline)

The monorepo has a **single** root `.circleci/config.yml` (not one per
service) with six jobs — build/test and a Snyk scan for each of the three
services, all running from the one pipeline.

1. Go to **circleci.com** → Log in with GitHub.
2. Select the `overnight` project → **Set Up Project** → select `main`.
   CircleCI detects `.circleci/config.yml` at the repo root automatically.
3. Go to **Project Settings → Environment Variables** and add:

   | Variable     | Value                            |
   | ------------ | -------------------------------- |
   | `SNYK_TOKEN` | Your Snyk API token (see Step 8) |

4. **Enable uncertified public orbs.** The config uses the community
   `snyk/snyk` orb, which CircleCI blocks by default. Go to
   **Organization Settings → Security** and enable "Allow uncertified
   public orbs," or every pipeline will error out immediately with
   `Orb snyk/snyk@2.0.3 not loaded`.
5. Trigger a pipeline by pushing any commit (or **Trigger Pipeline** in the
   CircleCI UI). All six jobs should go green:
   `backend-build-test`, `backend-security-scan`, `analytics-build-test`,
   `analytics-security-scan`, `frontend-build-test`, `frontend-security-scan`.

---

## Step 8 — Snyk (dependency scanning)

1. Go to **snyk.io** → Sign up with GitHub.
2. Go to **Account Settings → General → Auth Token** → copy your token.
3. Add it as `SNYK_TOKEN` in the CircleCI project (Step 7).
4. Optionally: also connect Snyk directly to GitHub for PR-level scanning
   (Snyk → Integrations → GitHub → grant access to your repos).

---

## Step 9 — UptimeRobot (health monitoring)

1. Go to **uptimerobot.com** → Create Free Account.
2. **Add Monitor** → HTTP(s):
   - **Friendly Name:** `Overnight Backend`
   - **URL:** the real backend URL from Step 4, e.g.
     `https://overnight-backend-9820.onrender.com/actuator/health` (not
     necessarily the plain `overnight-backend.onrender.com`)
   - **Monitoring Interval:** 5 minutes
3. Add a second monitor:
   - **Friendly Name:** `Overnight Analytics`
   - **URL:** the real analytics URL from Step 3 + `/health`
   - **Monitoring Interval:** 5 minutes
4. Under **Alert Contacts**, add your email so you get notified on downtime.

> **HEAD request gotcha:** UptimeRobot's HTTP(s) monitor sends `HEAD`
> requests, not `GET`. FastAPI/Starlette routes declared with only
> `@app.get(...)` return `405 Method Not Allowed` on `HEAD`, so the
> analytics `/health` route showed as permanently "down" even though the
> service was healthy for real traffic. Fixed by registering it as
> `@app.api_route("/health", methods=["GET", "HEAD"])`
> (`overnight-analytics/app/main.py`). Spring Boot's Actuator health
> endpoint already supports `HEAD` automatically, so the backend monitor
> was never affected. If a monitor looks stuck on a stale status after
> fixing something, pause and immediately resume it in the UI (or via the
> API) to force a fresh check rather than waiting for the next interval.

---

## Post-deploy checklist

- [ ] `GET /api/hotels` returns 24 hotels
- [ ] `GET /api/ping` returns `{"status":"ok"}`
- [ ] `GET /actuator/health` returns `{"status":"UP"}`
- [ ] Analytics service `/health` returns `{"status":"ok"}`
- [ ] Frontend loads at Vercel/Netlify URL and hotels appear
- [ ] Admin login works: username `admin`, password `overnight2024`
- [ ] Booking flow works end-to-end (create a test reservation)
- [ ] Analytics dashboard shows segments (may need analytics service warmed up)
- [ ] CircleCI: all six jobs green (build/test + Snyk scan × 3 services)
- [ ] UptimeRobot: both monitors green (status `up`, not stuck on a stale check)
- [ ] GitHub Actions: run the Supabase keep-alive workflow manually once to verify
- [ ] Render (both services) and Vercel are connected to the `overnight`
      monorepo with the correct Root Directory set — not to an old
      standalone repo

---

## Environment variable quick reference

### overnight-backend (Render)

| Variable                 | Required | Example                                                                          |
| ------------------------ | -------- | -------------------------------------------------------------------------------- |
| `DB_URL`                 | ✅       | `jdbc:postgresql://...supabase.com:6543/postgres?sslmode=require&pgbouncer=true` |
| `DB_USERNAME`            | ✅       | `postgres.abcdefghijkl`                                                          |
| `DB_PASSWORD`            | ✅       | your Supabase DB password                                                        |
| `JWT_SECRET`             | ✅       | `$(openssl rand -hex 32)`                                                        |
| `ANALYTICS_SERVICE_URL`  | ✅       | the real analytics service URL (may have a Render-assigned suffix)              |
| `JWT_EXPIRATION_MINUTES` | optional | `120`                                                                            |

### overnight-analytics (Render)

No environment variables needed.

### overnight-frontend (Vercel/Netlify)

| Variable            | Required | Example                                                    |
| ------------------- | -------- | ----------------------------------------------------------- |
| `VITE_API_BASE_URL` | ✅       | the real backend service URL (may have a Render-assigned suffix) |

### GitHub Actions (overnight-backend repo secrets)

| Secret              | Where to get it                         |
| ------------------- | --------------------------------------- |
| `SUPABASE_URL`      | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |

---

## Monorepo migration gotchas

When the three original repos were merged into this one, every deploy
target kept working from its **old** repo connection — merging repos
doesn't automatically repoint anything. None of this is a code bug; it's
config left pointing at the wrong place. In case this ever needs
repeating (or reverting), here's everything that broke and the fix:

1. **Render (backend + analytics) kept building from the old standalone
   repos.** Fix: re-point each service's `repo` and `rootDir` to the
   monorepo (Render API: `PATCH /v1/services/{id}` with
   `{"repo": "...", "branch": "main", "rootDir": "overnight-backend"}` —
   changing the repo alone isn't enough, `branch` must be sent too or the
   API rejects it with "branch does not exist").
2. **Render's service URL isn't always the plain name.** If a service is
   recreated, the `<name>.onrender.com` slug can already be taken, and
   Render silently assigns a suffixed one instead
   (`overnight-backend-9820.onrender.com`). Always read the real URL from
   the dashboard/API, don't assume it matches the service name.
3. **Vercel kept building from the old `overnight-frontend` repo**, and
   its Root Directory was `.` (repo root) instead of `overnight-frontend`.
   Fix: `vercel git connect` to switch the repo, then
   `vercel project update --root-directory overnight-frontend`.
4. **Vercel's GitHub App didn't have access to the new repo**, which
   surfaced as a confusing `The specified Root Directory
   "overnight-frontend" does not exist` build error — the folder existed,
   Vercel just couldn't see the repo. Fixed via
   github.com/settings/installations → Vercel → Configure → grant access.
5. **Per-repo `.circleci/config.yml` files became invisible.** CircleCI
   only reads `.circleci/config.yml` at the actual repo root, so the three
   old per-service configs (each living inside its own subfolder) were
   silently ignored. Replaced with one root config with all six jobs.
6. **CircleCI blocked the Snyk orb** ("uncertified public orbs" org
   setting) — this would have blocked the old per-repo setup too; it just
   never got hit before. Enable it under Organization Settings → Security.
7. **The frontend Snyk scan job never ran `npm install`** before scanning,
   so Snyk had no `node_modules` to build a dependency tree from and
   errored out. This bug existed in the original per-repo config too.
8. **UptimeRobot's analytics monitor was stuck "down"** — unrelated to the
   monorepo migration itself, but found while re-verifying monitoring
   during it. See the HEAD request gotcha in Step 9.
