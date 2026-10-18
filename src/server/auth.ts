import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth';
import type { Database } from './db/client';
import { account, session, user, verification } from './db/schema';
import { AppError } from './lib/errors';
import type { CloudflareBindings } from './types';

const authSchema = { user, session, account, verification };

export const isAuthConfigured = (bindings: CloudflareBindings): boolean =>
  Boolean(
      bindings.BETTER_AUTH_SECRET?.trim() &&
      bindings.BETTER_AUTH_URL?.trim() &&
      bindings.SUPABASE_DB_URL?.trim(),
  );

export const createAuth = (bindings: CloudflareBindings, db: Database) => {
  const secret = bindings.BETTER_AUTH_SECRET?.trim();
  const rawBaseURL = bindings.BETTER_AUTH_URL?.trim();

  if (!secret || !rawBaseURL) {
    throw new AppError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.');
  }

  // Ensure /api/auth is attached to baseURL so Better-Auth parses the endpoint correctly
  const baseURL = rawBaseURL.endsWith('/api/auth')
    ? rawBaseURL
    : `${rawBaseURL.replace(/\/$/, '')}/api/auth`;

  return betterAuth({
    secret,
    baseURL,
    trustedOrigins: [bindings.CORS_ORIGIN || rawBaseURL],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      useSecureCookies: bindings.APP_ENV === 'production',
    },
  });
};
