import { AppError } from '../lib/errors';

export interface TmdbSummary {
  tmdbId: number;
  title: string;
  overview: string;
  releaseYear: number | null;
  releaseDate: string | null;
  posterUrl: string;
  voteAverage: number;
}

interface TmdbListItem {
  id: number;
  media_type?: 'movie' | 'tv';
  title?: string;
  name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  vote_average?: number;
}

interface TmdbListResponse {
  page?: number;
  results?: TmdbListItem[];
  total_pages?: number;
  total_results?: number;
}

/**
 * Query values for `/discover/movie`, keyed by TMDB's own parameter names
 * (e.g. `sort_by`, `with_genres`, `vote_average.gte`) so callers can pass a
 * validated request straight through.
 */
export type TmdbDiscoverQuery = Record<string, string | number | boolean | undefined>;

/** A single page of TMDB results with the pagination metadata TMDB returns. */
export interface TmdbPage {
  page: number;
  results: TmdbSummary[];
  totalPages: number;
  totalResults: number;
}

export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const API_BASE_URL = 'https://api.themoviedb.org/3';

export class TmdbService {
  private readonly tokenOrKey: string;
  private readonly isBearerToken: boolean;

  constructor(tmdbCredential?: string) {
    if (!tmdbCredential?.trim()) {
      throw new AppError(
        503,
        'TMDB_NOT_CONFIGURED',
        'TMDB is not configured. Set TMDB_READ_TOKEN or TMDB_API_KEY in the environment.'
      );
    }
    this.tokenOrKey = tmdbCredential.trim();
    // TMDB v4 Read Access Tokens are JWTs starting with "eyJ"
    this.isBearerToken = this.tokenOrKey.startsWith('eyJ');
  }

  private buildUrl(path: string, params: Record<string, string> = {}): URL {
    const url = new URL(`${API_BASE_URL}${path}`);
    url.searchParams.set('language', 'en-US');

    if (!this.isBearerToken) {
      url.searchParams.set('api_key', this.tokenOrKey);
    }

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url;
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const headers: Record<string, string> = {
      accept: 'application/json',
    };

    if (this.isBearerToken) {
      headers.Authorization = `Bearer ${this.tokenOrKey}`;
    }

    const response = await fetch(this.buildUrl(path, params), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new AppError(502, 'TMDB_REQUEST_FAILED', 'TMDB request failed.', { status: response.status });
    }
    return (await response.json()) as T;
  }

  private toSummary(item: TmdbListItem): TmdbSummary | null {
    if (!item.id) return null;

    const title = item.title ?? item.name;
    if (!title) return null;

    const releaseDate = item.release_date ?? item.first_air_date ?? null;

    let releaseYear: number | null = null;
    if (releaseDate && releaseDate.length >= 4) {
      const year = Number(releaseDate.slice(0, 4));
      releaseYear = Number.isFinite(year) && year > 0 ? year : null;
    }

    return {
      tmdbId: item.id,
      title,
      overview: item.overview ?? '',
      releaseYear,
      releaseDate,
      posterUrl: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : '',
      voteAverage: item.vote_average ?? 0,
    };
  }

  private toList(response: TmdbListResponse, limitPerSection: number): TmdbSummary[] {
    return (response.results ?? [])
      .map((item) => this.toSummary(item))
      .filter((item): item is TmdbSummary => item !== null)
      .slice(0, limitPerSection);
  }

  private toPage(response: TmdbListResponse): TmdbPage {
    return {
      page: response.page ?? 1,
      results: (response.results ?? [])
        .map((item) => this.toSummary(item))
        .filter((item): item is TmdbSummary => item !== null),
      totalPages: response.total_pages ?? 0,
      totalResults: response.total_results ?? 0,
    };
  }

  /** Drop blanks and stringify the rest so values are safe to append to a URL. */
  private toParams(query: TmdbDiscoverQuery): Record<string, string> {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params[key] = String(value);
    }
    return params;
  }

  async landing(limitPerSection = 12): Promise<{ trending: TmdbSummary[]; topRated: TmdbSummary[]; nowPlaying: TmdbSummary[] }> {
    const [trending, topRated, nowPlaying] = await Promise.all([
      this.request<TmdbListResponse>('/trending/all/day'),
      this.request<TmdbListResponse>('/movie/top_rated'),
      this.request<TmdbListResponse>('/movie/now_playing'),
    ]);

    return {
      trending: this.toList(trending, limitPerSection),
      topRated: this.toList(topRated, limitPerSection),
      nowPlaying: this.toList(nowPlaying, limitPerSection),
    };
  }

  /**
   * Find movies with TMDB's `/discover/movie` filters and sort options.
   * Comma-separated values are AND queries, pipes are OR queries — TMDB's
   * convention is preserved because the query is passed through untouched.
   */
  async discoverMovies(query: TmdbDiscoverQuery = {}): Promise<TmdbPage> {
    const response = await this.request<TmdbListResponse>('/discover/movie', this.toParams(query));
    return this.toPage(response);
  }

  /** A page of movies currently playing in theatres. */
  async nowPlaying(query: TmdbDiscoverQuery = {}): Promise<TmdbPage> {
    const response = await this.request<TmdbListResponse>('/movie/now_playing', this.toParams(query));
    return this.toPage(response);
  }

  async findByTitle(title: string): Promise<TmdbSummary | null> {
    if (!title.trim()) return null;
    const response = await this.request<TmdbListResponse>('/search/movie', { query: title });
    const first = response.results?.[0];
    return first ? this.toSummary(first) : null;
  }
}
