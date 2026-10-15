import { Hono } from 'hono';
import type { AppEnv } from '../types';

export const healthRoutes = new Hono<AppEnv>()
  .get('/health', (c) => c.json({ status: 'ok', environment: c.env.APP_ENV ?? 'unknown' }));
