# Setup guide — dev & production

This app talks to three services:

| Service | What it is used for |
| --- | --- |
| **Supabase** | Postgres database (auth tables, movies, favorites, lists) |
| **OpenAI** | Embeddings for the vector search + the recommendation model |
| **TMDB** | Trending/top-rated landing data, posters, movie enrichment |

Auth = [Better Auth](https://better-auth.com) with Drizzle ORM, both connected **directly to Supabase Postgres** (not via the REST API), which is why the worker needs the DB connection string.

---

## 1. Supabase — collect your secrets

Dashboard: <https://supabase.com/dashboard/project>

### a) Project URL + service role key

1. Project → **Project Settings → API**.
2. Copy **Project URL**.
3. For the server you need a *secret* key — copy the **service role** key (format `sb_secret_…`).
   - It bypasses Row Level Security. **Never** put it in client code / frontend env.

### b) Database password (connect string)

The worker's Database URL can be found in Project Settings → Database.

1. Project → **Project Settings → Database → Reset database password** (click "Reset", save the password — it cannot be shown again).
2. Project → **Connect → Pooled connection string (URI)**. It looks like:
   ```
   postgres://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres
   ```
   Use the **pooled** string (port **6543**). It matches the server's `prepare: false` setting and works from Cloudflare Workers.

> If any of these secrets were ever pasted into chats/tools: reset them right away
> (DB password → step b; service role key → *rolls* in Settings → API).

### c) Recommended Supabase settings

- **Authentication → Sign In / Providers → PoW check** (leaked password protection) — enable it.
- When you rotate the DB password, update `SUPABASE_DB_URL` everywhere (dev + production).

---

## 2. OpenAI + TMDB

- **OpenAI**: <https://platform.openai.com/api-keys> → *Create new secret key* (`sk-…`). Needed for embeddings (`text-embedding-ada-002`) and `gpt-4o-mini`.
- **TMDB**:
  1. <https://www.themoviedb.org/signup> → account → **Settings → API** → *Create* an API key (choose "Developer").
  2. Copy the **API key (v3 auth)** string of 32 hex chars — the worker uses it as `TMDB_API_KEY`.
  3. Rate limits: ~50 req/s; the worker only calls TMDB between your requests.

---

## 3. Local development (`.dev.vars`)

1. `cp .dev.vars.example .dev.vars`
2. Fill in the values from the previous steps.
3. Generate a BETTER_AUTH_SECRET:
   ```
   npm run auth:secret
   ```
4. `.dev.vars` is **git-ignored** — always keep it that way. Full reference:

| Variable | Source | Where it is used |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | `npm run auth:secret` | Signs Better Auth's cookies/tokens |
| `BETTER_AUTH_URL` | free (dev) — `http://localhost:8787` | Better Auth base URL (used for callback URLs) |
| `SUPABASE_URL` | Supabase Settings → API | Supabase REST client (jar/isolated scripts) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Settings → API | Server-side REST calls (bypasses RLS) |
| `SUPABASE_DB_URL` | Supabase Connect (pooled) | Drizzle + Better Auth direct Postgres connection |
| `OPENAI_API_KEY` | platform.openai.com | embedding + completions |
| `TMDB_API_KEY` | themoviedb.org | trending/top-rated feed + poster metadata |

Run migrations (already applied once, generates new ones for future schema changes):

```
npx drizzle-kit generate     # after editing src/server/db/schema/*
```

Seed the movie catalogue (downloads the TMDB trending+top-rated and embeds it):

```
npm run seed:movies            # defaults to 40 movies
npm run seed:movies -- --count 80
```

Start:

```
npm run dev
```

---

## 4. Production (Cloudflare Workers)

Non-secret configuration lives in `wrangler.jsonc` → `env.production.vars` — update the two
placeholders there (`CORS_ORIGIN` and `BETTER_AUTH_URL`) to your real production domain
before the first deploy.

Everything secret is set as a **Wrangler secret** — it is never committed to config or the repo:

```
wrangler login

# Supabase (the Worker connects to Postgres directly; the REST keys are not read at runtime)
npx wrangler secret put SUPABASE_DB_URL --env production

# Auth (generate a fresh secret for production: npm run auth:secret)
npx wrangler secret put BETTER_AUTH_SECRET --env production

# AI + TMDB
npx wrangler secret put OPENAI_API_KEY --env production
npx wrangler secret put TMDB_API_KEY --env production

npm run deploy   # = npm run build && wrangler deploy --env production
```

`BETTER_AUTH_URL` and `CORS_ORIGIN` are *vars* (not secrets) and must match your real
production domain: that pairing drives OAuth callback URLs and cookie policy
(`useSecureCookies` turns on automatically when `APP_ENV=production`).

Notes:
- `npx wrangler secret list --env production` shows what is set.
- Rotating: re-run `wrangler secret put <KEY>`; Supabase DB password rotation also means
  updating `SUPABASE_DB_URL` in dev and production.

---

## 5. Database schema (Drizzle)

- Drizzle schema lives in `src/server/db/schema/` (`auth.ts` = generated with `npx auth@latest generate --adapter drizzle --dialect postgresql`; `app.ts` = app tables).
- Migration SQL is in `drizzle/` (deterministic transform → committed to git; applied with `supabase_apply_migration` or `npx drizzle-kit migrate`).
- Suspected change? `npx drizzle-kit generate -n a_short_name`, review the SQL, then apply it.

Better Auth tables (`user`, `session`, `account`, `verification`) have RLS **on with no REST policies** — they are deliberately closed to the Data API; all access happens through your server which connects with the DB password. App tables (`favorites`, `movie_lists`, `movie_list_items`, `recommendation_*`) have owner-based RLS policies as defense-in-depth for the exposed Data API.
