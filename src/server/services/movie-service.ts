import { sql, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { movies, recommendationRequests, recommendationResults } from '../db/schema';
import { AppError } from '../lib/errors';
import type { TmdbSummary } from './tmdb-service';

export interface SavedRecommendation {
  tmdbId: number;
  title: string;
  releaseYear: string | number;
  content: string;
  posterUrl: string | null;
}

interface PreferencesInput {
  favoriteMovie: string;
  mood: string;
  favoriteGenre: string;
}

export const upsertMovie = async (db: Database, summary: TmdbSummary) => {
  const [movie] = await db
    .insert(movies)
    .values({
      tmdbId: summary.tmdbId,
      title: summary.title,
      overview: summary.overview,
      releaseDate: summary.releaseDate,
      releaseYear: summary.releaseYear,
      posterPath: summary.posterUrl.replace('https://image.tmdb.org/t/p/w500', '') || null,
      voteAverage: summary.voteAverage,
    })
    .onConflictDoUpdate({
      target: movies.tmdbId,
      set: {
        title: summary.title,
        overview: summary.overview,
        releaseDate: summary.releaseDate,
        releaseYear: summary.releaseYear,
        posterPath: summary.posterUrl.replace('https://image.tmdb.org/t/p/w500', '') || null,
        voteAverage: summary.voteAverage,
      },
    })
    .returning();
  return movie!;
};

const toVectorText = (embedding: number[]): string => `[${embedding.join(',')}]`;

export class MovieService {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async contextFor(embedding: number[]): Promise<string> {
    const embeddingText = toVectorText(embedding);
    const matches = await this.db.execute<{ content: string }>(
      sql`select content from match_movies(${embeddingText}::extensions.vector, ${0.5}, ${3})`,
    );
    return matches.length
      ? matches
          .map((match, index) => `[Rank ${index + 1}]: ${match.content}`)
          .join('\n')
      : 'No local movie context found.';
  }

  async saveRecommendation(
    userId: string | undefined,
    preferences: PreferencesInput,
    recommendations: SavedRecommendation[],
    latencyMs: number,
  ): Promise<void> {
    const [request] = await this.db
      .insert(recommendationRequests)
      .values({
        userId: userId ?? null,
        favoriteMovie: preferences.favoriteMovie,
        mood: preferences.mood,
        favoriteGenre: preferences.favoriteGenre,
        status: 'completed',
        model: 'gpt-4o-mini',
        latencyMs,
      })
      .returning({ id: recommendationRequests.id });
    if (!request) throw new AppError(502, 'HISTORY_SAVE_FAILED', 'Recommendation history could not be saved.');

    await this.db.insert(recommendationResults).values(
      recommendations.map((movie, index) => ({
        requestId: request.id,
        rank: index + 1,
        title: movie.title,
        releaseYear: String(movie.releaseYear ?? ''),
        content: movie.content,
        posterUrl: movie.posterUrl || null,
        tmdbId: movie.tmdbId || null,
      })),
    );
  }

  async history(userId: string) {
    const rows = await this.db
      .select({
        id: recommendationRequests.id,
        favoriteMovie: recommendationRequests.favoriteMovie,
        mood: recommendationRequests.mood,
        favoriteGenre: recommendationRequests.favoriteGenre,
        status: recommendationRequests.status,
        latencyMs: recommendationRequests.latencyMs,
        createdAt: recommendationRequests.createdAt,
        resultRank: recommendationResults.rank,
        resultTitle: recommendationResults.title,
        resultReleaseYear: recommendationResults.releaseYear,
        resultContent: recommendationResults.content,
      })
      .from(recommendationRequests)
      .leftJoin(recommendationResults, eq(recommendationResults.requestId, recommendationRequests.id))
      .where(eq(recommendationRequests.userId, userId))
      .orderBy(desc(recommendationRequests.createdAt), recommendationResults.rank)
      .limit(120);

    const grouped = new Map<string, {
      id: string;
      favoriteMovie: string;
      mood: string;
      favoriteGenre: string;
      status: string;
      latencyMs: number | null;
      createdAt: Date | null;
      results: Array<{ rank: number | null; title: string; releaseYear: string; content: string }>;
    }>();
    for (const row of rows) {
      const entry = grouped.get(row.id) ?? {
        id: row.id,
        favoriteMovie: row.favoriteMovie,
        mood: row.mood,
        favoriteGenre: row.favoriteGenre,
        status: row.status,
        latencyMs: row.latencyMs,
        createdAt: row.createdAt,
        results: [],
      };
      if (row.resultTitle) {
        entry.results.push({
          rank: row.resultRank,
          title: row.resultTitle,
          releaseYear: row.resultReleaseYear ?? '',
          content: row.resultContent ?? '',
        });
      }
      grouped.set(row.id, entry);
    }
    return Array.from(grouped.values()).slice(0, 20);
  }
}
