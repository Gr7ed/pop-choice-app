# Copilot instructions for PopChoice

## Commands

This is a Vite app with dependencies managed by npm.

```bash
npm install
npm start          # start the Vite development server
npm run dev        # equivalent development command
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

There are currently no test or lint scripts configured in `package.json`, and no test runner is present. There is therefore no repository-defined single-test command.

## Architecture

- `index.html` is the page shell and loads `src/main.jsx` as the React entrypoint. Application source lives under `src/`, with styles in `src/styles`, integrations and schemas in `src/lib`, and static assets in `public/`.
- `src/App.jsx` owns the composed client-side UI flow:
  1. Read the three preference fields and compose a natural-language query.
  2. Create an OpenAI embedding for the query.
  3. Call Supabase RPC `match_movies` to retrieve semantically similar movie text chunks.
  4. Send the retrieved context and user query to OpenAI with a strict JSON response schema.
  5. If the model requests `web_search`, query TMDB and send the tool result back for the final response.
  6. Render recommendation cards through reusable React components.
- `src/lib/recommendationService.js` initializes the browser-side OpenAI and Supabase clients lazily and handles recommendation requests. `src/lib/api/schemas.js` defines both the structured recommendation response and the `web_search` function schema.
- `src/lib/data/movies.txt` is the source corpus for vector ingestion. Ingestion is not part of normal app startup.
- `doc.sql` must be applied to Supabase with the `vector` extension available. It defines the `movies` table and the `match_movies` RPC used by the recommendation flow.
- `src/lib/data/movies.js` contains a separate static movie dataset and is not part of the current runtime path.

## Environment and integration conventions

- Browser-exposed configuration uses Vite's `VITE_` prefix: `VITE_OPENAI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and optional `VITE_TMDB_API_KEY`. The ingestion helper additionally reads `VITE_SUPABASE_ADMIN_EMAIL` and `VITE_SUPABASE_ADMIN_PASSWORD`.
- OpenAI is deliberately initialized with `dangerouslyAllowBrowser: true`, so preserve the current client-only architecture unless a backend/proxy migration is explicitly requested. Never hard-code keys or commit `.env`.
- Keep the OpenAI response contract synchronized between `src/lib/api/schemas.js`, the prompt in `src/lib/recommendationService.js`, and `MovieCard` in `src/App.jsx`. Recommendation objects must contain `title`, `releaseYear`, and `content`.
- Supabase matching expects 1536-dimensional embeddings, uses `text-embedding-ada-002`, and currently queries with threshold `0.50` and count `3`. Changes to embedding models or dimensions require coordinated SQL and data migration changes.
- Tool calls are handled explicitly in `getChatCompletion`; preserve the assistant tool-call message and append a `tool` message with the matching `tool_call_id` before requesting the final response.
- Use DOM APIs and `DOMPurify` for recommendation rendering. Keep user/model/API text out of unsanitized HTML and preserve the existing loading/error message behavior.
- The form and result UI are coupled to the IDs and classes in `src/App.jsx` and `src/styles/index.css` (`favorite-movie`, `mood`, `favorite-genre`, and the movie-card classes). Update both sides together when changing the UI.
- Keep embedding ingestion sequential to avoid OpenAI rate-limit bursts and retain duplicate-content checks before inserting into Supabase.
