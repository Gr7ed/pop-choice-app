# PopChoice App

PopChoice is a React + Vite movie recommendation experience. It combines an accessible preference form with OpenAI embeddings, Supabase vector search, and optional TMDB poster lookup.

## Getting started

```bash
npm install
npm run dev
```

Create a `.env` file with the browser-exposed Vite variables:

```bash
VITE_OPENAI_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_TMDB_API_KEY=
```

After changing `.env`, restart the Vite development server. `VITE_SUPABASE_URL` must be the URL copied from Supabase Project Settings → Data API, not just the project reference.

## Commands

```bash
npm run build       # production build
npm test            # Vitest + Testing Library
npm run test:watch  # watch tests during development
npm run preview     # preview the production build
```

## Structure

- `src/App.jsx` contains the composed application and reusable form, results, and movie-card components.
- `src/styles/index.css` contains the responsive visual system, visible focus states, loading/error states, and reduced-motion behavior.
- `src/lib/recommendationService.js` isolates OpenAI, Supabase, and TMDB integration from the UI.
- `src/lib/api/schemas.js` contains the structured OpenAI response and tool schemas.
- `src/lib/data/movies.js` contains the optional static movie dataset, while `src/lib/data/movies.txt` is the vector-ingestion source corpus.
- `public/assets/` contains static assets served without bundling, such as the PopChoice logo.
- `src/App.test.jsx` covers required fields, successful recommendations, and user-safe error handling.

The embedding ingestion helpers are intentionally not part of the normal browser startup path. Apply `doc.sql` to Supabase before using vector recommendations.
