import postgres from 'postgres';
import { chunkContent, POSTER_BASE, toHash, readDevVar, readDevVars } from './lib/tmdb-lib.mjs';

// NOTE: `openai` must be dynamically imported *after* all global `fetch`
// calls — importing the SDK first makes subsequent global fetch promises
// never settle (openai v4 SDK ↔ Node 24 undici interop bug). The SDK's
// own internal fetches keep working once imported.

const TMDB_BASE = 'https://api.themoviedb.org/3';
const EMBEDDING_MODEL = 'text-embedding-ada-002';

const args = new Set(process.argv.slice(2));
const countArg = args.has('--count') ? Number(process.argv[process.argv.indexOf('--count') + 1]) : 40;
const limit = Number.isFinite(countArg) && countArg > 0 ? Math.min(Math.floor(countArg), 100) : 40;

const vars = readDevVars(new URL('../.dev.vars', import.meta.url));
const tmdbApiKey = readDevVar(vars, 'TMDB_API_KEY');
const openAiKey = readDevVar(vars, 'OPENAI_API_KEY');
const dbUrl = readDevVar(vars, 'SUPABASE_DB_URL');

for (const [name, value] of [['SUPABASE_DB_URL', dbUrl], ['OPENAI_API_KEY', openAiKey], ['TMDB_API_KEY', tmdbApiKey]]) {
  if (!value) {
    console.error(`Missing ${name} — set it in .dev.vars (or the process env).`);
    process.exit(1);
  }
}

const sql = postgres(dbUrl, { max: 1, prepare: false, fetch_types: false });

const tmdbGet = async (path) => {
  const response = await fetch(`${TMDB_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${tmdbApiKey}`);
  if (!response.ok) throw new Error(`TMDB ${path} failed with status ${response.status}`);
  return response.json();
};

const fetchCandidates = async () => {
  const [trending, topRated, genreList] = await Promise.all([
    tmdbGet('/trending/movie/week'),
    tmdbGet('/movie/top_rated'),
    tmdbGet('/genre/movie/list'),
  ]);
  const genreNames = new Map((genreList.genres ?? []).map((genre) => [genre.id, genre.name]));
  const toCandidate = (movie) => ({
    tmdbId: movie.id,
    title: movie.title,
    overview: movie.overview ?? '',
    releaseDate: movie.release_date || null,
    releaseYear: movie.release_date ? Number(movie.release_date.slice(0, 4)) : null,
    posterPath: movie.poster_path
      ? movie.poster_path.replace(POSTER_BASE, '')
      : null,
    voteAverage: movie.vote_average ?? null,
    voteCount: movie.vote_count ?? null,
    popularity: movie.popularity ?? null,
    genres: (movie.genre_ids ?? []).map((id) => genreNames.get(id)).filter(Boolean),
  });
  const byId = new Map();
  for (const movie of [...(trending.results ?? []), ...(topRated.results ?? [])]) {
    if (!byId.has(movie.id)) {
      byId.set(movie.id, toCandidate(movie));
    }
    if (byId.size >= limit) break;
  }
  return Array.from(byId.values()).slice(0, limit);
};

const main = async () => {
  const candidates = await fetchCandidates();
  console.log(`Preparing to seed ${candidates.length} movies from TMDB trending/week + top rated.`);

  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: openAiKey });

  let inserted = 0;
  let skipped = 0;

  for (const movie of candidates) {
    const [upserted] = await sql`
      insert into movies (tmdb_id, title, overview, release_date, release_year, poster_path, vote_average, vote_count, popularity, genres)
      values (${movie.tmdbId}, ${movie.title}, ${movie.overview}, ${movie.releaseDate}, ${movie.releaseYear},
              ${movie.posterPath}, ${movie.voteAverage}, ${movie.voteCount}, ${movie.popularity}, ${JSON.stringify(movie.genres)}::jsonb)
      on conflict (tmdb_id) do update set
        title = excluded.title,
        overview = excluded.overview,
        release_date = excluded.release_date,
        release_year = excluded.release_year,
        poster_path = excluded.poster_path,
        vote_average = excluded.vote_average,
        vote_count = excluded.vote_count,
        popularity = excluded.popularity,
        genres = excluded.genres,
        updated_at = now()
      returning id
    `;
    if (!upserted) throw new Error(`Failed to upsert movie "${movie.title}"`);

    const content = chunkContent(movie.title, movie.releaseYear, movie.overview, movie.genres);
    const contentHash = toHash(content);
    const [existingChunk] = await sql`select id from movie_chunks where content_hash = ${contentHash}`;
    if (existingChunk) {
      skipped += 1;
      continue;
    }

    const embeddingResponse = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: content });
    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding || embedding.length !== 1536) {
      throw new Error(`Expected a 1536-dimensional embedding for "${movie.title}".`);
    }
    await sql`
      insert into movie_chunks (movie_id, content, content_hash, embedding)
      values (${upserted.id}, ${content}, ${contentHash}, ${`[${embedding.join(',')}]`})
    `;
    inserted += 1;
    console.log(`Seeded (${inserted}/${candidates.length}): ${movie.title}${movie.releaseYear ? ` (${movie.releaseYear})` : ''}`);
  }

  console.log(`Done. Embedded ${inserted} new movies, skipped ${skipped} existing chunks, upserted ${candidates.length} movie records.`);
  await sql.end();
};

try {
  await main();
} catch (error) {
  console.error(error?.message ?? error);
  process.exit(1);
}
