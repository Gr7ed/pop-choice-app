import { createMiddleware } from 'hono/factory';
import { createAuth, isAuthConfigured } from '../auth';
import type { AppEnv } from '../types';

export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!isAuthConfigured(c.env)) {
    await next();
    return;
  }
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session?.user?.id) c.set('userId', session.user.id);
  await next();
});

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Sign-in is required for this resource.',
        requestId: c.get('requestId'),
      },
    }, 401);
  }
  await next();
});
