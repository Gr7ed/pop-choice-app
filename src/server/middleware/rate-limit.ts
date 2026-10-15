import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types';

export const recommendationRateLimit = createMiddleware<AppEnv>(async (c, next) => {
  const limiter = c.env.RECOMMENDATION_RATE_LIMITER;
  if (!limiter) {
    await next();
    return;
  }
  const actor = c.get('userId') || c.req.header('cf-connecting-ip') || 'anonymous';
  const result = await limiter.limit({ key: `recommendations:${actor}` });
  if (!result.success) {
    c.header('retry-after', '60');
    return c.json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many recommendation requests. Please try again shortly.',
        requestId: c.get('requestId'),
      },
    }, 429);
  }
  await next();
});
