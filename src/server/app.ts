import { Hono } from 'hono';
import type { Context } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';
import { optionalAuth } from './middleware/auth';
import { requestId } from './middleware/request-id';
import { securityHeaders } from './middleware/security';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { recommendationRoutes } from './routes/recommendations';
import type { AppEnv } from './types';

export const createApp = () => {
  const app = new Hono<AppEnv>();
  const serveApp = async (c: Context<AppEnv>) => {
    if (!c.env.ASSETS) return c.notFound();
    return c.env.ASSETS.fetch(new Request(new URL('/', c.req.url), c.req.raw));
  };
  app.use('*', requestId);
  app.use('*', securityHeaders);
  app.use('/api/*', corsMiddleware);
  app.use('/api/recommendations', optionalAuth);
  app.use('/api/history', optionalAuth);
  app.onError(errorHandler);
  app.route('/api', healthRoutes);
  app.route('/api', authRoutes);
  app.route('/api', recommendationRoutes);
  app.get('/sign-in', serveApp);
  app.get('/sign-up', serveApp);
  return app;
};
