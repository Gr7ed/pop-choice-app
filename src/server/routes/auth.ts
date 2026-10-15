import { Hono } from 'hono';
import { createAuth } from '../auth';
import { requireAuth } from '../middleware/auth';
import { MovieService } from '../services/movie-service';
import type { AppEnv } from '../types';

export const authRoutes = new Hono<AppEnv>()
  .all('/auth/*', (c) => createAuth(c.env).handler(c.req.raw))
  .get('/history', requireAuth, async (c) => {
    const history = await new MovieService(c.env).history(c.get('userId')!);
    return c.json({ history });
  });
