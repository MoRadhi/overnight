# Overnight — Deployment Guide

Complete step-by-step walkthrough for getting all three services live.
Follow the steps **in order** — each stage produces a URL the next one needs.

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

## Step 1 — Push repos to GitHub

Create three **public** repos (free CircleCI + Snyk require public repos unless you pay):

- `overnight-backend`
- `overnight-analytics`
- `overnight-frontend`

Push each local directory to its corresponding GitHub repo:

```bash
# In each repo directory:
git init
git add .
git commit -m "feat: initial scaffold"
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git push -u origin main
```

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
2. Connect your GitHub account and select `overnight-analytics`.
3. Settings:
   - **Name:** `overnight-analytics`
   - **Runtime:** Docker
   - **Branch:** `main`
   - No environment variables needed for this service.
4. Click **Create Web Service**.
5. Wait for the first deploy to finish (~3–5 min).
6. Copy the service URL: `https://overnight-analytics.onrender.com`
7. Confirm it's alive: `curl https://overnight-analytics.onrender.com/health`

---

## Step 4 — Deploy overnight-backend to Render

1. Go to **render.com** → New → Web Service.
2. Select `overnight-backend`.
3. Settings:
   - **Name:** `overnight-backend`
   - **Runtime:** Docker
   - **Branch:** `main`
4. Under **Environment Variables**, add:

   | Key                      | Value                                                         |
   | ------------------------ | ------------------------------------------------------------- |
   | `DB_URL`                 | JDBC string from Step 2                                       |
   | `DB_USERNAME`            | from Step 2                                                   |
   | `DB_PASSWORD`            | from Step 2                                                   |
   | `JWT_SECRET`             | Generate: `openssl rand -hex 32` (any 32+ char random string) |
   | `ANALYTICS_SERVICE_URL`  | `https://overnight-analytics.onrender.com`                    |
   | `JWT_EXPIRATION_MINUTES` | `120`                                                         |

5. Click **Create Web Service**.
6. Watch the deploy logs — you should see:
   ```
   ✓ Overnight seed data loaded — 3 hotels, 10 room types, 26 rooms, 8 guests, 17 reservations
   ```
   This confirms the DB tables were created and seeded.
7. Test it: `curl https://overnight-backend.onrender.com/api/hotels`

> **Render free tier cold-start:** The service sleeps after 15 min of inactivity
> and takes ~30–60s to wake up on the next request.
> **Before any demo**, hit the URL manually and wait for it to wake.

---

## Step 5 — Deploy overnight-frontend to Vercel

1. Go to **vercel.com** → Add New → Project.
2. Import `overnight-frontend` from GitHub.
3. Vercel auto-detects Vite. Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:

   | Key                 | Value                                    |
   | ------------------- | ---------------------------------------- |
   | `VITE_API_BASE_URL` | `https://overnight-backend.onrender.com` |

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

## Step 7 — CircleCI (CI pipelines)

1. Go to **circleci.com** → Log in with GitHub.
2. For each of the three repos, click **Set Up Project** → select `main`.
   CircleCI will detect the `.circleci/config.yml` automatically.
3. For each project, go to **Project Settings → Environment Variables** and add:

   | Variable     | Value                            |
   | ------------ | -------------------------------- |
   | `SNYK_TOKEN` | Your Snyk API token (see Step 8) |

4. Trigger a pipeline by pushing any commit. All three pipelines should go green.

---

## Step 8 — Snyk (dependency scanning)

1. Go to **snyk.io** → Sign up with GitHub.
2. Go to **Account Settings → General → Auth Token** → copy your token.
3. Add it as `SNYK_TOKEN` in each CircleCI project (Step 7).
4. Optionally: also connect Snyk directly to GitHub for PR-level scanning
   (Snyk → Integrations → GitHub → grant access to your repos).

---

## Step 9 — UptimeRobot (health monitoring)

1. Go to **uptimerobot.com** → Create Free Account.
2. **Add Monitor** → HTTP(s):
   - **Friendly Name:** `Overnight Backend`
   - **URL:** `https://overnight-backend.onrender.com/actuator/health`
   - **Monitoring Interval:** 5 minutes
3. Add a second monitor:
   - **Friendly Name:** `Overnight Analytics`
   - **URL:** `https://overnight-analytics.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
4. Under **Alert Contacts**, add your email so you get notified on downtime.

---

## Post-deploy checklist

- [ ] `GET /api/hotels` returns 3 hotels
- [ ] `GET /api/ping` returns `{"status":"ok"}`
- [ ] `GET /actuator/health` returns `{"status":"UP"}`
- [ ] Analytics service `/health` returns `{"status":"ok"}`
- [ ] Frontend loads at Vercel/Netlify URL and hotels appear
- [ ] Admin login works: username `admin`, password `overnight2024`
- [ ] Booking flow works end-to-end (create a test reservation)
- [ ] Analytics dashboard shows segments (may need analytics service warmed up)
- [ ] CircleCI: all three pipelines green
- [ ] UptimeRobot: both monitors green
- [ ] GitHub Actions: run the Supabase keep-alive workflow manually once to verify

---

## Environment variable quick reference

### overnight-backend (Render)

| Variable                 | Required | Example                                                                          |
| ------------------------ | -------- | -------------------------------------------------------------------------------- |
| `DB_URL`                 | ✅       | `jdbc:postgresql://...supabase.com:6543/postgres?sslmode=require&pgbouncer=true` |
| `DB_USERNAME`            | ✅       | `postgres.abcdefghijkl`                                                          |
| `DB_PASSWORD`            | ✅       | your Supabase DB password                                                        |
| `JWT_SECRET`             | ✅       | `$(openssl rand -hex 32)`                                                        |
| `ANALYTICS_SERVICE_URL`  | ✅       | `https://overnight-analytics.onrender.com`                                       |
| `JWT_EXPIRATION_MINUTES` | optional | `120`                                                                            |

### overnight-analytics (Render)

No environment variables needed.

### overnight-frontend (Vercel/Netlify)

| Variable            | Required | Example                                  |
| ------------------- | -------- | ---------------------------------------- |
| `VITE_API_BASE_URL` | ✅       | `https://overnight-backend.onrender.com` |

### GitHub Actions (overnight-backend repo secrets)

| Secret              | Where to get it                         |
| ------------------- | --------------------------------------- |
| `SUPABASE_URL`      | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
