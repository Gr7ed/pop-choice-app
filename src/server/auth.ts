import { betterAuth } from 'better-auth';
import { AppError } from './lib/errors';
import type { CloudflareBindings } from './types';

export const isAuthConfigured = (bindings: CloudflareBindings): boolean =>
  Boolean(bindings.BETTER_AUTH_SECRET?.trim() && bindings.BETTER_AUTH_URL?.trim());

export const createAuth = (bindings: CloudflareBindings) => {
  const secret = bindings.BETTER_AUTH_SECRET?.trim();
  const baseURL = bindings.BETTER_AUTH_URL?.trim();
  if (!secret || !baseURL) {
    throw new AppError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.');
  }
  return betterAuth({
    secret,
    baseURL,
    trustedOrigins: [bindings.CORS_ORIGIN || baseURL],
    emailAndPassword: {
      enabled: true,
    },
    advanced: {
      useSecureCookies: bindings.APP_ENV === 'production',
    },
  });
};
