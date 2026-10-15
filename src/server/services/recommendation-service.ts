import { recommendationResponseSchema, type PreferencesInput } from '../schemas/recommendations';
import { OpenAiService } from './openai-service';
import { MovieService } from './movie-service';
import type { CloudflareBindings } from '../types';

export class RecommendationService {
  private readonly openai: OpenAiService;
  private readonly movies: MovieService;

  constructor(bindings: CloudflareBindings) {
    this.openai = new OpenAiService(bindings);
    this.movies = new MovieService(bindings);
  }

  async create(preferences: PreferencesInput) {
    const startedAt = Date.now();
    const query = `My favorite movie is ${preferences.favoriteMovie}. My current mood is ${preferences.mood}. My preferred genres are ${preferences.favoriteGenre}.`;
    const embedding = await this.openai.embed(query);
    const context = await this.movies.contextFor(embedding);
    const result = recommendationResponseSchema.parse(await this.openai.recommend(context, query));
    const recommendations = await Promise.all(result.recommendations.map(async (movie) => ({
      ...movie,
      posterUrl: await this.movies.enrich(movie.title),
    })));
    try {
      await this.movies.saveRecommendation(preferences.userId, preferences, recommendations, Date.now() - startedAt);
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        code: 'HISTORY_PERSISTENCE_FAILED',
        error: error instanceof Error ? error.message : 'Unknown history persistence error',
        cause: error instanceof Error && 'cause' in error
          ? (error.cause as { code?: string; message?: string } | undefined)?.code
          : undefined,
      }));
    }
    return { recommendations };
  }
}
