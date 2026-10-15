export const logError = (requestId: string, error: unknown): void => {
  const appError = error as { cause?: { code?: string; message?: string } };
  console.error(JSON.stringify({
    level: 'error',
    requestId,
    error: error instanceof Error ? error.message : 'Unknown server error',
    cause: appError.cause?.code || appError.cause?.message,
  }));
};
