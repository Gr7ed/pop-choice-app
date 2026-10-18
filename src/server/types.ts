import type { Database } from './db/client';

export interface CloudflareBindings {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  APP_ENV?: string;
  CORS_ORIGIN?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_SECRET?: string;
  SUPABASE_DB_URL?: string;
  OPENAI_API_KEY?: string;
  TMDB_READ_TOKEN?: string;
  TMDB_API_KEY?: string;
  RECOMMENDATION_RATE_LIMITER?: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
}

export interface AppVariables {
  requestId: string;
  userId?: string;
  db?: Database;
}

export type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: AppVariables;
};
