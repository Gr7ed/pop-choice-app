import type { SupabaseClient } from '@supabase/supabase-js';

export interface CloudflareBindings {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  APP_ENV?: string;
  CORS_ORIGIN?: string;
  BETTER_AUTH_URL?: string;
  BETTER_AUTH_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAI_API_KEY?: string;
  TMDB_API_KEY?: string;
  RECOMMENDATION_RATE_LIMITER?: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
}

export interface AppVariables {
  requestId: string;
  userId?: string;
  supabase?: SupabaseClient;
}

export type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: AppVariables;
};
