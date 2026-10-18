import { Hono } from 'hono';
import { createAuth } from '../auth';
import { requireDatabase } from '../middleware/database';
import type { AppEnv } from '../types';

export const authRoutes = new Hono<AppEnv>()
  .all('/auth/*', (c) => createAuth(c.env, requireDatabase(c)).handler(c.req.raw));
