import { isAppError } from './errors';

export const logError = (requestId: string, error: unknown): void => {
  const appError = error as { cause?: { code?: string; message?: string } };
  const status = isAppError(error) ? error.status : 500;
  const isServerError = status >= 500;
  const payload = {
    level: isServerError ? 'error' : 'warn',
    requestId,
    ...(isAppError(error) ? { status, code: error.code } : {}),
    error: error instanceof Error ? error.message : 'Unknown server error',
    cause: appError.cause?.code || appError.cause?.message,
  };
  const log = isServerError ? console.error : console.warn;
  log(JSON.stringify(payload));
};
