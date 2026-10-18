import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { requireDatabase } from '../middleware/database';
import { recommendationRateLimit } from '../middleware/rate-limit';
import { preferencesSchema } from '../schemas/recommendations';
import { MovieService } from '../services/movie-service';
import { RecommendationService } from '../services/recommendation-service';
import type { AppEnv } from '../types';

export const recommendationRoutes = new Hono<AppEnv>()
  .get('/recommendations', (c) => {
    c.header('allow', 'POST');
    return c.json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Use POST /api/recommendations with favoriteMovie, mood, and favoriteGenre.',
        requestId: c.get('requestId'),
      },
    }, 405);
  })
  .post('/recommendations', recommendationRateLimit, zValidator('json', preferencesSchema), async (c) => {
    const service = new RecommendationService(requireDatabase(c), c.env);
    const result = await service.create({ ...c.req.valid('json'), userId: c.get('userId') });
    return c.json(result);
  })
  .get('/history', requireAuth, async (c) => {
    const history = await new MovieService(requireDatabase(c)).history(c.get('userId')!);
    return c.json({ history });
  });
