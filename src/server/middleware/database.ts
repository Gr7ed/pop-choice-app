import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { createDatabase, type Database } from '../db/client';
import { AppError } from '../lib/errors';
import type { AppEnv } from '../types';

export const databaseMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const connectionString = c.env.SUPABASE_DB_URL?.trim();
  if (!connectionString) {
    await next();
    return;
  }

  const { db, close } = createDatabase(connectionString);
  c.set('db', db);
  try {
    await next();
  } finally {
    try {
      c.executionCtx.waitUntil(close());
    } catch {
      await close();
    }
  }
});

export const requireDatabase = (c: Context<AppEnv>): Database => {
  const db = c.get('db');
  if (!db) {
    throw new AppError(503, 'SUPABASE_NOT_CONFIGURED', 'Set SUPABASE_DB_URL in the environment.');
  }
  return db;
};
