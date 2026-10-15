import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../lib/errors';
import type { CloudflareBindings } from '../types';

interface MovieMatch {
  id: number;
  content: string;
  similarity: number;
}

interface TmdbMovie {
  title: string;
  release_date?: string;
  poster_path?: string | null;
}

export class MovieService {
  private readonly supabase: SupabaseClient;
  private readonly tmdbApiKey?: string;

  constructor(bindings: CloudflareBindings) {
    const supabaseUrl = bindings.SUPABASE_URL?.trim();
    const serviceRoleKey = bindings.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!supabaseUrl || !serviceRoleKey) {
      throw new AppError(503, 'SUPABASE_NOT_CONFIGURED', 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .dev.vars and restart the Worker.');
    }
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.tmdbApiKey = bindings.TMDB_API_KEY?.trim() || undefined;
  }

  async contextFor(embedding: number[]): Promise<string> {
    const { data, error } = await this.supabase.rpc('match_movies', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3,
    });
    if (error) throw new AppError(502, 'VECTOR_SEARCH_FAILED', 'Movie search is temporarily unavailable.', error);
    const matches = (data ?? []) as MovieMatch[];
    return matches.length
      ? matches.map((match, index) => `[Rank ${index + 1}]: ${match.content}`).join('\n')
      : 'No local movie context found.';
  }

  async enrich(title: string): Promise<string | null> {
    if (!this.tmdbApiKey) return null;
    const url = new URL('https://api.themoviedb.org/3/search/movie');
    url.searchParams.set('query', title);
    url.searchParams.set('api_key', this.tmdbApiKey);
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json() as { results?: TmdbMovie[] };
    const posterPath = data.results?.[0]?.poster_path;
    return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
  }

  async saveRecommendation(
    userId: string | undefined,
    preferences: { favoriteMovie: string; mood: string; favoriteGenre: string },
    recommendations: Array<{ title: string; releaseYear: string; content: string; posterUrl?: string | null }>,
    latencyMs: number,
  ): Promise<void> {
    const { data, error } = await this.supabase
      .from('recommendation_requests')
      .insert({
        user_id: userId ?? null,
        favorite_movie: preferences.favoriteMovie,
        mood: preferences.mood,
        favorite_genre: preferences.favoriteGenre,
        status: 'completed',
        model: 'gpt-4o-mini',
        latency_ms: latencyMs,
      })
      .select('id')
      .single();
    if (error || !data) {
      if (error?.code === 'PGRST205') {
        throw new AppError(503, 'DATABASE_SCHEMA_NOT_READY', 'Recommendation history tables are missing. Apply the Supabase migrations and restart the Worker.');
      }
      throw new AppError(502, 'HISTORY_SAVE_FAILED', 'Recommendation history could not be saved.', error);
    }
    const { error: resultError } = await this.supabase.from('recommendation_results').insert(
      recommendations.map((movie, index) => ({
        request_id: data.id,
        rank: index + 1,
        title: movie.title,
        release_year: movie.releaseYear,
        content: movie.content,
        poster_url: movie.posterUrl ?? null,
      })),
    );
    if (resultError) {
      if (resultError.code === 'PGRST205') {
        throw new AppError(503, 'DATABASE_SCHEMA_NOT_READY', 'Recommendation history tables are missing. Apply the Supabase migrations and restart the Worker.');
      }
      throw new AppError(502, 'HISTORY_SAVE_FAILED', 'Recommendation history could not be saved.', resultError);
    }
  }

  async history(userId: string) {
    const { data, error } = await this.supabase
      .from('recommendation_requests')
      .select('id, favorite_movie, mood, favorite_genre, status, latency_ms, created_at, recommendation_results(rank, title, release_year, content, poster_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw new AppError(502, 'HISTORY_READ_FAILED', 'Recommendation history is temporarily unavailable.', error);
    return data ?? [];
  }
}
