import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { isAppError } from '../lib/errors';
import { logError } from '../lib/logger';
import type { AppEnv } from '../types';

export const errorHandler: ErrorHandler<AppEnv> = (error, c) => {
  const requestId = c.get('requestId');
  logError(requestId, error);
  const appError = isAppError(error) ? error : undefined;
  return c.json({
    error: {
      code: appError?.code ?? 'INTERNAL_ERROR',
      message: appError?.message ?? 'The request could not be completed.',
      requestId,
    },
  }, (appError?.status ?? 500) as ContentfulStatusCode);
};
