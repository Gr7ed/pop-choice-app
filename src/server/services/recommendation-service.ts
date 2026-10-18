import { recommendationResponseSchema, type PreferencesInput } from '../schemas/recommendations';
import type { Database } from '../db/client';
import { OpenAiService } from './openai-service';
import { MovieService } from './movie-service';
import { TmdbService } from './tmdb-service';
import type { CloudflareBindings } from '../types';

export interface RecommendationResult {
  tmdbId: number;
  title: string;
  releaseYear: string;
  content: string;
  posterUrl: string | null;
  voteAverage: number | null;
}

export class RecommendationService {
  private readonly openai: OpenAiService;
  private readonly tmdb: TmdbService;
  private readonly movies: MovieService;

  constructor(db: Database, bindings: CloudflareBindings) {
    this.openai = new OpenAiService(bindings);
    this.tmdb = new TmdbService(bindings.TMDB_READ_TOKEN ?? bindings.TMDB_API_KEY);
    this.movies = new MovieService(db);
  }

  async create(preferences: PreferencesInput) {
    const startedAt = Date.now();
    const query = `My favorite movie is ${preferences.favoriteMovie}. My current mood is ${preferences.mood}. My preferred genres are ${preferences.favoriteGenre}.`;
    const embedding = await this.openai.embed(query);
    const context = await this.movies.contextFor(embedding);
    const parsed = recommendationResponseSchema.parse(await this.openai.recommend(context, query));

    const recommendations: RecommendationResult[] = await Promise.all(
      parsed.recommendations.map(async (movie) => {
        let tmdbId = 0;
        let voteAverage: number | null = null;
        let posterUrl: string | null = movie.posterUrl ?? null;
        try {
          const summary = await this.tmdb.findByTitle(movie.title);
          if (summary) {
            tmdbId = summary.tmdbId;
            voteAverage = summary.voteAverage;
            posterUrl = posterUrl || summary.posterUrl;
          }
        } catch {
          // TMDB metadata enrichment is best-effort.
        }
        return {
          tmdbId,
          title: movie.title,
          releaseYear: movie.releaseYear,
          content: movie.content,
          posterUrl: posterUrl ?? null,
          voteAverage,
        };
      }),
    );

    try {
      await this.movies.saveRecommendation(preferences.userId, preferences, recommendations, Date.now() - startedAt);
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        code: 'HISTORY_PERSISTENCE_FAILED',
        error: error instanceof Error ? error.message : 'Unknown history persistence error',
      }));
    }
    return { recommendations };
  }
}
