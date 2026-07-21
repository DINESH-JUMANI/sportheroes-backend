# Sport Heroes Backend — Production Deployment Guide

Step-by-step guide to run this API in production:

1. **PostgreSQL on Supabase** (database)
2. **Express API on Vercel** (backend hosting)

This project uses **Express + Prisma + flat SQL migrations** (`prisma/migrations/*.sql` via `scripts/run-migration.js`), not `prisma migrate`. Follow the migration section carefully.

---

## Prerequisites

| Tool | Why |
|------|-----|
| [Node.js](https://nodejs.org/) 18+ | Local scripts, Prisma generate, migrations |
| [GitHub](https://github.com/) account | Connect repo to Vercel (recommended) |
| [Supabase](https://supabase.com/) account | Hosted Postgres |
| [Vercel](https://vercel.com/) account | Host the API |
| [Firebase](https://console.firebase.google.com/) project | Phone auth (same project as your Flutter app) |
| Optional: [Vercel CLI](https://vercel.com/docs/cli) | `npm i -g vercel` for CLI deploys |

Keep a password manager ready. You will create a strong DB password and a long random `JWT_SECRET`.

---

## Part A — Supabase (Production Postgres)

### A1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Choose organization, name (e.g. `sportheroes-prod`), region closest to your users (and preferably close to your Vercel region).
3. Set a **strong database password** and store it safely. You cannot recover it later easily.
4. Wait until the project is fully provisioned.

### A2. Get connection strings

In Supabase:

**Project Settings → Database → Connection string**

You need **two** URLs:

| Purpose | Mode | Port | Used for |
|---------|------|------|----------|
| App runtime (Prisma on Vercel) | **Transaction** pooler | `6543` | `DATABASE_URL` |
| Migrations / one-off SQL | **Direct** or **Session** | `5432` | Temporary local `.env` when running migrations |

#### Runtime URL (pooled) — put this in Vercel as `DATABASE_URL`

Use the **Transaction** pooler URI from Supabase **Connect** and add Prisma’s pgbouncer flag:

```text
postgresql://postgres.<PROJECT_REF>:<YOUR_PASSWORD>@aws-1-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Example (this project’s region is Mumbai / `ap-south-1`):

```text
postgresql://postgres.lhixxanbbfhkplibonfu:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Notes:

- Copy the exact host from Supabase → **Connect** → **Transaction pooler** (host may be `aws-0-...` or `aws-1-...`).
- Username is `postgres.<PROJECT_REF>`, not just `postgres`.
- If the password contains special characters (`@`, `#`, `%`, etc.), URL-encode them (e.g. `@` → `%40`).
- Prefer the pooler over **Direct** (`db.<ref>.supabase.co:5432`) — direct is often **IPv6-only** and fails on many networks (including local Windows).

#### Local / migrations URL — Session pooler (IPv4)

```text
postgresql://postgres.<PROJECT_REF>:<YOUR_PASSWORD>@aws-1-<REGION>.pooler.supabase.com:5432/postgres
```

Use this for local `npm run dev` and `npm run db:migrate:*`. Avoid relying on the Direct connection unless your network has working IPv6.

### A3. Allow your IP for migrations (if required)

Some Supabase plans restrict direct DB access.

1. **Project Settings → Database → Network restrictions** (or **Connection pooling** docs for your plan).
2. If connections fail from your laptop, temporarily allow your IP, run migrations, then tighten rules again.
3. Vercel serverless IPs are dynamic — that is why the app must use the **pooler** URL, not only a locked-down direct host without pooler.

### A4. Apply Sport Heroes schema (migrations)

Do this **from your laptop** against the **direct** (or session) URL — not from Vercel.

1. In the repo root, create a temporary `.env.production.local` (do **not** commit it):

```env
DATABASE_URL=postgresql://postgres:<YOUR_PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres
```

2. Or temporarily set `DATABASE_URL` in your shell / overwrite local `.env` while migrating (restore local URL afterward).

3. Install deps and generate Prisma client (optional for SQL migrations, required later for the app):

```bash
npm install
npm run db:generate
```

4. Run migrations **in order**. Skip **dev seed** files in production (`7` and `8`).

```bash
# Core schema
npm run db:migrate:1
npm run db:migrate:2
npm run db:migrate:3
npm run db:migrate:4
npm run db:migrate:5
npm run db:migrate:6

# Skip 7 and 8 (dev users) on production

# Sports seed + later schema updates
npm run db:migrate:9
npm run db:migrate:10
npm run db:migrate:11
npm run db:migrate:12
npm run db:migrate:13
npm run db:migrate:14
npm run db:migrate:15
```

Equivalent one-liner style (still skipping 7–8):

```bash
node scripts/run-migration.js 1.add_user.sql
node scripts/run-migration.js 2.add_sports_and_player_profiles.sql
node scripts/run-migration.js 3.add_teams.sql
node scripts/run-migration.js 4.add_tournaments.sql
node scripts/run-migration.js 5.add_matches.sql
node scripts/run-migration.js 6.add_statistics.sql
node scripts/run-migration.js 9.seed_sports.sql
node scripts/run-migration.js 10.team_roles_and_logo_blob.sql
node scripts/run-migration.js 11.sport_specific_rules.sql
node scripts/run-migration.js 12.team_logo_blob.sql
node scripts/run-migration.js 13.teams_all_sports.sql
node scripts/run-migration.js 14.add_venues.sql
node scripts/run-migration.js 15.help_and_support.sql
```

5. Verify in Supabase:

- **Table Editor** — you should see tables such as `users`, `sports`, `teams`, `matches`, `venues`, support tables, etc.
- **SQL Editor** — optional smoke check:

```sql
SELECT COUNT(*) FROM sports;
```

### A5. Optional: Supabase SQL Editor instead of Node script

If `pg` from your machine cannot connect, paste each migration file’s contents into **SQL Editor → New query → Run**, in the same order as above (skip 7 and 8).

---

## Part B — Make the Express app Vercel-ready

Vercel runs **serverless functions**, not a long-lived `node dist/server.js` process. You need a small serverless entry that exports the Express `app`, plus Prisma settings for Linux + connection pooling.

### B1. Add Prisma binary target for Vercel

In `prisma/schema.prisma`, update the generator:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

Then locally:

```bash
npm run db:generate
```

### B2. Cache Prisma Client in production (serverless)

In `src/config/prisma.ts`, cache the client on `globalThis` in **all** environments (not only development). Vercel reuses warm instances; without a singleton you can exhaust Supabase connections.

Recommended pattern:

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;
```

### B3. Create serverless entry `api/index.ts`

Create folder `api/` at the repo root and add `api/index.ts`:

```ts
import dotenv from 'dotenv';
dotenv.config();

import app from '../src/app';
import { assertConfig } from '../src/config/config';
import { initFirebase } from '../src/config/firebase';

assertConfig();
initFirebase();

export default app;
```

`src/server.ts` stays for local `npm run dev` / `npm start`. Vercel uses `api/index.ts` instead of `app.listen`.

### B4. Add `vercel.json`

Create `vercel.json` at the repo root:

```json
{
  "version": 2,
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

### B5. Update `package.json` scripts for Vercel + Prisma

Add / adjust scripts so Vercel generates Prisma Client during install/build:

```json
"scripts": {
  "postinstall": "prisma generate",
  "vercel-build": "prisma generate && tsc",
  "build": "tsc",
  "start": "node dist/server.js",
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
}
```

Keep your existing `db:migrate:*` scripts.

**Important:** move `prisma` from `devDependencies` to `dependencies` (or keep `prisma` available at install time on Vercel). If the build fails with `prisma: command not found`, move it:

```bash
npm install prisma --save
```

`@prisma/client` should already be in `dependencies`.

### B6. TypeScript / Vercel Node notes

- Vercel compiles the `/api` entry with its Node runtime.
- Ensure `tsconfig` can resolve `src/**/*` imports from `api/index.ts` (path already works with relative imports).
- Local production-like check (optional):

```bash
npm i -g vercel
vercel dev
```

---

## Part C — Environment variables (Production)

### C1. Values you must set on Vercel

| Variable | Production value | Notes |
|----------|------------------|-------|
| `NODE_ENV` | `production` | Enables strict config checks in `assertConfig()` |
| `DATABASE_URL` | Supabase **Transaction pooler** URI + `?pgbouncer=true` | See Part A2 |
| `JWT_SECRET` | Long random secret | e.g. `openssl rand -base64 48` |
| `JWT_ISSUER` | `sportheroes-api` | Or your chosen issuer |
| `AUTH_TOKEN_EXPIRY_DAYS` | `7` (or your policy) | Days |
| `FIREBASE_PROJECT_ID` | Firebase project id | Same as Flutter app |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Firebase Console → Project settings → Service accounts |
| `FIREBASE_PRIVATE_KEY` | Full PEM private key | See C2 below |
| `SWAGGER_ENABLED` | `true` or `false` | `true` if you want `/api/docs` in prod |
| `LOG_LEVEL` | `info` or `warn` | Prefer less noisy than `debug` |
| `PORT` | Optional | Vercel ignores listen port; safe to omit |

Do **not** set or rely on local-only helpers like `DEV_USER_ID` / `db:seed:dev` in production.

### C2. Firebase private key on Vercel

In Firebase Console:

1. **Project settings → Service accounts → Generate new private key**.
2. From the downloaded JSON, copy `project_id`, `client_email`, `private_key`.

On Vercel, paste the private key as **one line** with literal `\n` escapes (same as local `.env`):

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

The app already normalizes `\n` → real newlines in `src/config/config.ts`.

Never commit real keys to Git. Rotate any key that was ever committed or shared.

### C3. Generate a production JWT secret

```bash
# Git Bash / macOS / Linux
openssl rand -base64 48

# PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

---

## Part D — Deploy to Vercel

### D1. Push code to GitHub

1. Commit the Vercel/Prisma changes (`api/index.ts`, `vercel.json`, `package.json`, `prisma/schema.prisma`, `src/config/prisma.ts`).
2. Push to your GitHub remote (e.g. `main` or `production` branch).

Do not push `.env` files.

### D2. Create the Vercel project

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. **Import** the `sportheroes-backend` GitHub repository.
3. Framework preset: **Other** (or leave default).
4. Root directory: repository root.
5. Build settings (typical):

| Setting | Value |
|---------|--------|
| Build Command | `npm run vercel-build` (or leave empty if `vercel-build` / `postinstall` already generate Prisma) |
| Output Directory | leave empty |
| Install Command | `npm install` |

6. Do **not** deploy yet until env vars are set (or deploy once, then add env and redeploy).

### D3. Add environment variables in Vercel

**Project → Settings → Environment Variables**

Add every variable from section C1 for **Production** (and Preview if you want staging).

Tips:

- Prefer **Production** scope for live secrets.
- After changing env vars, trigger a **Redeploy**.

### D4. Deploy

- Click **Deploy**, or push a new commit to the connected branch.
- Or CLI:

```bash
vercel --prod
```

When finished, Vercel shows a URL like:

```text
https://sportheroes-backend-xxxx.vercel.app
```

### D5. Smoke-test the live API

```bash
curl https://YOUR_DEPLOYMENT.vercel.app/health
curl https://YOUR_DEPLOYMENT.vercel.app/
```

Healthy response example:

```json
{
  "status": "healthy",
  "timestamp": "...",
  "services": {
    "database": "connected",
    "server": "running"
  }
}
```

If `SWAGGER_ENABLED=true`:

```text
https://YOUR_DEPLOYMENT.vercel.app/api/docs
```

API base for Flutter / FE:

```text
https://YOUR_DEPLOYMENT.vercel.app/api/v1
```

Examples:

- `POST /api/v1/auth/...`
- `GET /api/v1/sports`
- `GET /health`

### D6. Custom domain (optional)

1. Vercel → **Project → Settings → Domains**.
2. Add e.g. `api.yourdomain.com`.
3. Set DNS records as Vercel instructs.
4. Point the Flutter app’s API base URL to that domain.

---

## Part E — Frontend / Firebase checklist

1. Set the Flutter (or web) **API base URL** to the Vercel URL (or custom domain).
2. Ensure Firebase **Phone Auth** is enabled for production.
3. Add any required authorized domains in Firebase (for web clients).
4. Confirm production builds do **not** call `POST /api/v1/auth/dev-login` (dev-only when `NODE_ENV=development`).

---

## Part F — Ongoing operations

### New SQL migrations

1. Add `prisma/migrations/N.something.sql`.
2. Run it locally against Supabase **direct** URL with `node scripts/run-migration.js N.something.sql`.
3. Deploy backend code to Vercel if the API changed.
4. Document the new file in this guide / `package.json` scripts.

### Secrets rotation

- Rotate `JWT_SECRET` only if you accept logging all users out (existing tokens become invalid).
- Rotate Firebase service account key in Firebase + update Vercel env + redeploy.
- Rotate Supabase DB password → update `DATABASE_URL` on Vercel → redeploy; re-test `/health`.

### Logs & debugging

- Vercel → **Deployments → [deployment] → Functions / Logs**.
- Supabase → **Logs** / **Database** for connection errors.
- Common failure: `database: disconnected` on `/health` → wrong `DATABASE_URL`, missing `?pgbouncer=true`, or password encoding.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ERR_REQUIRE_ESM` involving `jose` / `jwks-rsa` | ESM-only `jose@6` with CommonJS on Vercel | Keep `package.json` `overrides.jose` at `4.15.9` and redeploy |
| Browser shows Vercel **Login** page | Deployment Protection enabled | Vercel → Settings → Deployment Protection → turn off for Production (public API) |
| `/health` → database disconnected | Bad `DATABASE_URL`, using direct URL without allowing Vercel, or wrong password | Use **Transaction pooler** + `pgbouncer=true`; URL-encode password |
| `prisma: command not found` on build | `prisma` only in devDependencies | Move `prisma` to `dependencies`; ensure `postinstall` / `vercel-build` runs `prisma generate` |
| Missing Prisma engine / query engine errors | Wrong binary target | Add `rhel-openssl-3.0.x` to `binaryTargets`, regenerate, redeploy |
| Firebase verify fails | Bad `FIREBASE_PRIVATE_KEY` formatting | Use quoted PEM with `\n` escapes; redeploy after fix |
| `Missing required environment variable` | `NODE_ENV=production` without all secrets | Set `JWT_SECRET`, `DATABASE_URL`, Firebase trio |
| 404 on all routes | Missing rewrite / wrong entry | Confirm `vercel.json` rewrite to `/api` and `api/index.ts` exports `app` |
| Migration fails from laptop | Network restrictions / wrong direct URL | Use Supabase SQL Editor or allow your IP |
| Connection limit errors | Too many Prisma clients | Use global Prisma singleton + pooler URL |

---

## Quick production checklist

- [ ] Supabase project created; DB password stored safely
- [ ] Migrations 1–6 and 9–15 applied (skipped 7–8)
- [ ] Sports seed verified (`SELECT` on `sports`)
- [ ] `binaryTargets` include `rhel-openssl-3.0.x`
- [ ] Prisma singleton caches in production
- [ ] `api/index.ts` + `vercel.json` present
- [ ] `postinstall` / `vercel-build` runs `prisma generate`
- [ ] All production env vars set on Vercel
- [ ] Deploy succeeded; `/health` returns `healthy`
- [ ] Flutter API base URL updated
- [ ] No `.env` or service-account JSON committed to Git

---

## Architecture (production)

```text
Flutter / clients
       │  HTTPS
       ▼
 Vercel (Express serverless via api/index.ts)
       │  Prisma + pooled Postgres
       ▼
 Supabase PostgreSQL (Transaction pooler :6543)
```

Local development can keep using `npm run dev` + local Postgres (or a separate Supabase **staging** project). Prefer a dedicated Supabase project for production so local resets never wipe live data.
