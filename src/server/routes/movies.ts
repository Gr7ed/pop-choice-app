import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { discoverMovieQuerySchema, nowPlayingQuerySchema } from '../schemas/movies';
import { TmdbService } from '../services/tmdb-service';
import type { AppEnv, CloudflareBindings } from '../types';

const tmdbFor = (env: CloudflareBindings) =>
  new TmdbService(env.TMDB_READ_TOKEN ?? env.TMDB_API_KEY);

/**
 * Read-only movie discovery routes. They proxy TMDB's `/discover/movie` and
 * `/movie/now_playing` endpoints so provider credentials stay server-side and
 * every query is validated before it reaches TMDB.
 */
export const movieRoutes = new Hono<AppEnv>()
  .get('/movies/discover', zValidator('query', discoverMovieQuerySchema), async (c) => {
    const page = await tmdbFor(c.env).discoverMovies(c.req.valid('query'));
    return c.json(page);
  })
  .get('/movies/now-playing', zValidator('query', nowPlayingQuerySchema), async (c) => {
    const page = await tmdbFor(c.env).nowPlaying(c.req.valid('query'));
    return c.json(page);
  });
