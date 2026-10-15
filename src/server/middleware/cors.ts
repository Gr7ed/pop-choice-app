import { cors } from 'hono/cors';

export const corsMiddleware = cors({
  origin: (origin, c) => {
    const allowedOrigin = c.env.CORS_ORIGIN?.trim();
    if (!origin || !allowedOrigin) return allowedOrigin || origin;
    return origin === allowedOrigin ? origin : '';
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
});
