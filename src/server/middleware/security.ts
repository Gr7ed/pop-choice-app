import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../types';

export const securityHeaders = createMiddleware<AppEnv>(async (c, next) => {
  c.header('x-content-type-options', 'nosniff');
  c.header('x-frame-options', 'DENY');
  c.header('referrer-policy', 'strict-origin-when-cross-origin');
  c.header('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  await next();
});
