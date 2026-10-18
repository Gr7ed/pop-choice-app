import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requireDatabase } from '../middleware/database';
import { LibraryService } from '../services/library-service';
import { TmdbService } from '../services/tmdb-service';
import { listCreateSchema, moviePayloadSchema, tmdbIdParamSchema } from '../schemas/library';
import type { AppEnv } from '../types';

const summaryFromPayload = (payload: typeof moviePayloadSchema._output) => ({
  tmdbId: payload.tmdbId,
  title: payload.title,
  overview: payload.overview ?? '',
  releaseYear: payload.releaseYear ?? null,
  releaseDate: null,
  posterUrl: payload.posterUrl ?? '',
  voteAverage: payload.voteAverage ?? 0,
});

export const libraryRoutes = new Hono<AppEnv>()
  .get('/discover', async (c) => {
    const tmdb = new TmdbService(c.env.TMDB_READ_TOKEN ?? c.env.TMDB_API_KEY);
    return c.json(await tmdb.landing());
  })
  .get('/discover-debug', async (c) => {
    const tmdb = new TmdbService(c.env.TMDB_READ_TOKEN ?? c.env.TMDB_API_KEY);
    const payload = await tmdb.landing();
    console.log('DISCOVER_DEBUG', JSON.stringify(payload));
    return c.json(payload);
  })
  .get('/favorites', requireAuth, async (c) => {
    const library = new LibraryService(requireDatabase(c));
    return c.json({ favorites: await library.favoriteMovies(c.get('userId')!) });
  })
  .put(
    '/favorites/:tmdbId',
    requireAuth,
    zValidator('param', tmdbIdParamSchema),
    zValidator('json', moviePayloadSchema),
    async (c) => {
      const library = new LibraryService(requireDatabase(c));
      const params = c.req.valid('param');
      const payload = c.req.valid('json');
      await library.addFavorite(c.get('userId')!, summaryFromPayload(payload));
      return c.json({ ok: true, tmdbId: params.tmdbId });
    },
  )
  .delete('/favorites/:tmdbId', requireAuth, zValidator('param', tmdbIdParamSchema), async (c) => {
    const library = new LibraryService(requireDatabase(c));
    const { tmdbId } = c.req.valid('param');
    await library.removeFavorite(c.get('userId')!, tmdbId);
    return c.json({ ok: true });
  })
  .get('/lists', requireAuth, async (c) => {
    const library = new LibraryService(requireDatabase(c));
    return c.json({ lists: await library.listSummaries(c.get('userId')!) });
  })
  .post('/lists', requireAuth, zValidator('json', listCreateSchema), async (c) => {
    const library = new LibraryService(requireDatabase(c));
    const body = c.req.valid('json');
    const list = await library.createList(c.get('userId')!, body.name);
    return c.json({ list }, 201);
  })
  .delete('/lists/:listId', requireAuth, async (c) => {
    const library = new LibraryService(requireDatabase(c));
    await library.deleteList(c.get('userId')!, c.req.param('listId'));
    return c.json({ ok: true });
  })
  .post(
    '/lists/:listId/movies',
    requireAuth,
    zValidator('json', moviePayloadSchema),
    async (c) => {
      const library = new LibraryService(requireDatabase(c));
      const listId = c.req.param('listId');
      const payload = c.req.valid('json');
      await library.addToList(c.get('userId')!, listId, summaryFromPayload(payload));
      return c.json({ ok: true }, 201);
    },
  )
  .delete('/lists/:listId/movies/:tmdbId', requireAuth, zValidator('param', tmdbIdParamSchema), async (c) => {
    const library = new LibraryService(requireDatabase(c));
    const listId = c.req.param('listId');
    const { tmdbId } = c.req.valid('param');
    await library.removeFromList(c.get('userId')!, listId, tmdbId);
    return c.json({ ok: true });
  });
