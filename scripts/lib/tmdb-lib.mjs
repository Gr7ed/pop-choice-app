import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

/**
 * Reads a key from pre-loaded `.dev.vars` contents (falling back to env).
 */
export const readDevVar = (contents, key) => {
  if (process.env[key]) return process.env[key];
  const match = contents?.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match?.[1]?.trim() ?? undefined;
};

export const readDevVars = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
};

export const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

export const toPosterUrl = (posterPath) =>
  posterPath ? `${POSTER_BASE}${posterPath}` : '';

export const chunkContent = (title, releaseYear, overview, genres = []) => {
  const genreLine = genres.length ? `\nGenres: ${genres.join(', ')}.` : '';
  const titleLine = releaseYear ? `${title} (${releaseYear})` : title;
  return `${titleLine}\n${overview ?? ''}${genreLine}`.trim();
};

export const toHash = (content) => createHash('sha256').update(content).digest('hex');
