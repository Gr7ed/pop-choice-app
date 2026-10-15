import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const readVars = async () => {
  const path = resolve(root, '.dev.vars');
  const source = await readFile(path, 'utf8');
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [
          line.slice(0, separator).trim(),
          line.slice(separator + 1).trim().replace(/^"(.*)"$/, '$1'),
        ];
      }),
  );
};

const parseMovies = (source) => source
  .split(/\r?\n\s*\r?\n/)
  .map((block) => block.trim())
  .filter(Boolean)
  .map((content) => {
    const firstLine = content.split(/\r?\n/, 1)[0];
    const match = firstLine.match(/^(.*?):\s*(\d{4})\b/);
    return {
      title: match?.[1]?.trim() || firstLine.slice(0, 200),
      release_year: match ? Number(match[2]) : null,
      content,
      content_hash: createHash('sha256').update(content).digest('hex'),
    };
  });

const main = async () => {
  const vars = await readVars();
  const openAiKey = vars.OPENAI_API_KEY;
  const supabaseUrl = vars.SUPABASE_URL;
  const serviceRoleKey = vars.SUPABASE_SERVICE_ROLE_KEY;

  if (!openAiKey || !supabaseUrl || !serviceRoleKey) {
    throw new Error('Set OPENAI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY in .dev.vars first.');
  }

  const [source, openai, supabase] = await Promise.all([
    readFile(resolve(root, 'src/lib/data/movies.txt'), 'utf8'),
    Promise.resolve(new OpenAI({ apiKey: openAiKey })),
    Promise.resolve(createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })),
  ]);

  const movies = parseMovies(source);
  let seeded = 0;
  let skipped = 0;

  for (const movie of movies) {
    const { data: existing, error: existingError } = await supabase
      .from('movie_chunks')
      .select('id')
      .eq('content_hash', movie.content_hash)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      skipped += 1;
      continue;
    }

    const { data: existingMovie, error: existingMovieError } = await supabase
      .from('movies')
      .select('id')
      .eq('title', movie.title)
      .eq('release_year', movie.release_year)
      .maybeSingle();
    if (existingMovieError) throw existingMovieError;
    let movieRow = existingMovie;
    if (!movieRow) {
      const { data: insertedMovie, error: movieError } = await supabase
        .from('movies')
        .insert({
          title: movie.title,
          release_year: movie.release_year,
        })
        .select('id')
        .single();
      if (movieError) throw movieError;
      movieRow = insertedMovie;
    }

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: movie.content,
    });
    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding || embedding.length !== 1536) {
      throw new Error(`Expected a 1536-dimensional embedding for "${movie.title}".`);
    }

    const { error: chunkError } = await supabase.from('movie_chunks').insert({
      movie_id: movieRow.id,
      content: movie.content,
      content_hash: movie.content_hash,
      embedding,
    });
    if (chunkError) throw chunkError;

    seeded += 1;
    console.log(`Seeded ${seeded}/${movies.length}: ${movie.title}`);
  }

  console.log(`Finished. Seeded ${seeded} movies; skipped ${skipped} existing movies.`);
};

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
