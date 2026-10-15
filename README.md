# PopChoice App

PopChoice is a React + Vite movie recommendation experience served by a modular Hono API on Cloudflare Workers. Provider credentials stay server-side while Supabase provides Postgres/pgvector storage and Better Auth provides sessions.

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts two processes:

- React/Vite client: `http://localhost:5173`
- Hono/Cloudflare Worker: `http://localhost:8787`

Vite proxies `/api/*` from port `5173` to the Worker on port `8787`, so browser requests remain relative (`/api/...`) and CORS is not needed for normal local use. Better Auth's local base URL is the Worker URL (`http://localhost:8787`), while its trusted frontend origin remains `http://localhost:5173`.

`/api/recommendations` accepts `POST` only. Opening the URL directly in a browser sends `GET` and returns `405 Method Not Allowed`; submit the preference form or send JSON with `favoriteMovie`, `mood`, and `favoriteGenre`.

Create a `.dev.vars` file for the Worker by copying `.dev.vars.example`:

```bash
cp .dev.vars.example .dev.vars
npm run auth:secret
```

Copy the generated value into `BETTER_AUTH_SECRET` in `.dev.vars`, then set `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `TMDB_API_KEY`. Do not prefix these server-only values with `VITE_`; Vite variables are shipped to the browser.

After editing `.dev.vars`, restart `npm run dev`. Wrangler reads `.dev.vars` when the Worker starts; changing the file does not update an already-running Worker.

If `BETTER_AUTH_SECRET` is absent, `/api/auth/*` returns `503 AUTH_NOT_CONFIGURED`. Anonymous recommendation routes still remain available, but authenticated routes cannot work until the secret is configured.

## Commands

```bash
npm run build       # production build
npm run deploy      # build and deploy the production Worker with Wrangler
npm run cf-typegen  # generate Cloudflare binding types
npm test            # Vitest + Testing Library
npm run test:watch  # watch tests during development
npm run preview     # preview the production build
```

## Structure

- `src/App.tsx` contains the composed application and reusable form, results, and movie-card components.
- `src/styles/index.css` contains the responsive visual system, visible focus states, loading/error states, and reduced-motion behavior.
- `src/lib/api-client.ts` calls the Hono recommendation API; no provider credentials are used in the browser.
- `src/worker/index.ts` is the Cloudflare Worker entrypoint, following the official Vite React template layout.
- `src/server/` contains the Hono app, routes, middleware, Better Auth integration, provider services, and validation schemas.
- `db/migrations/` contains Supabase schema and vector-search migrations.
- `public/assets/` contains static assets served without bundling, such as the PopChoice logo.
- `src/App.test.tsx` covers required fields, successful recommendations, and user-safe error handling.

The project keeps the template's Cloudflare Vite plugin, Worker deployment flow, TypeScript build gate, ESLint setup, and SPA asset handling while adding PopChoice's recommendation and authentication features.

Apply the SQL migrations to Supabase before using vector recommendations. Configure the production Worker secrets with `wrangler secret put`; never commit `.env`, `.dev.vars`, or provider keys.

For local Supabase setup, run both files from the Supabase SQL Editor in order:

```text
db/migrations/001_initial_schema.sql
db/migrations/002_better_auth.sql
```

The `recommendation_requests` and `recommendation_results` tables must exist before the recommendation endpoint can persist history.

Recommendation generation is resilient to history persistence failures: the user still receives recommendations while the Worker logs `HISTORY_PERSISTENCE_FAILED`. Apply the migrations to enable history and the authenticated history endpoint.

To seed the movie vector corpus locally, first apply `db/migrations/001_initial_schema.sql`, then run:

```powershell
npm run seed:movies
```

The seeder reads `src/lib/data/movies.txt`, creates or reuses movie metadata, generates `text-embedding-ada-002` vectors with `OPENAI_API_KEY`, and inserts `movie_chunks` sequentially using `SUPABASE_SERVICE_ROLE_KEY`. It is safe to run again because `content_hash` prevents duplicate chunks. This consumes OpenAI embedding quota.

Before the first production deploy, replace the placeholder production domain in `wrangler.jsonc`, then set secrets:

```bash
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put SUPABASE_URL --env production
wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
wrangler secret put TMDB_API_KEY --env production
```

Apply `db/migrations/001_initial_schema.sql` and `db/migrations/002_better_auth.sql` in Supabase before enabling authenticated history. The Cloudflare Worker provides edge distribution and the configured rate-limit binding; a multi-origin Cloudflare Load Balancer is intentionally deferred until a second origin exists.
