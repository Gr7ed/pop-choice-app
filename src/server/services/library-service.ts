import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/client';
import { favorites, movieListItems, movieLists, movies } from '../db/schema';
import { AppError } from '../lib/errors';
import { upsertMovie } from './movie-service';
import type { TmdbSummary } from './tmdb-service';

export interface LibraryMovie {
  tmdbId: number;
  title: string;
  releaseYear: number | null;
  posterUrl: string;
  voteAverage: number | null;
  overview: string | null;
}

export interface ListSummary {
  id: string;
  name: string;
  items: LibraryMovie[];
}

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

const toLibraryMovie = (movie: typeof movies.$inferSelect): LibraryMovie => ({
  tmdbId: movie.tmdbId,
  title: movie.title,
  releaseYear: movie.releaseYear,
  posterUrl: movie.posterPath ? `${POSTER_BASE}${movie.posterPath}` : '',
  voteAverage: movie.voteAverage,
  overview: movie.overview,
});

export class LibraryService {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async favoriteMovies(userId: string): Promise<LibraryMovie[]> {
    const rows = await this.db
      .select({ movie: movies })
      .from(favorites)
      .innerJoin(movies, eq(favorites.movieId, movies.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    return rows.map((row) => toLibraryMovie(row.movie));
  }

  async addFavorite(userId: string, summary: TmdbSummary): Promise<void> {
    const movie = await upsertMovie(this.db, summary);
    const inserted = await this.db
      .insert(favorites)
      .values({ userId, movieId: movie.id })
      .onConflictDoNothing()
      .returning({ id: favorites.id });
    if (inserted.length === 0) {
      throw new AppError(409, 'ALREADY_FAVORITED', 'Movie is already in favorites.');
    }
  }

  async removeFavorite(userId: string, tmdbId: number): Promise<void> {
    const target = await this.db
      .select({ id: movies.id })
      .from(movies)
      .where(eq(movies.tmdbId, tmdbId))
      .limit(1);
    const movieId = target[0]?.id;
    if (!movieId) throw new AppError(404, 'FAVORITE_NOT_FOUND', 'Movie is not in favorites.');
    const deleted = await this.db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.movieId, movieId)))
      .returning({ id: favorites.id });
    if (deleted.length === 0) {
      throw new AppError(404, 'FAVORITE_NOT_FOUND', 'Movie is not in favorites.');
    }
  }

  async listSummaries(userId: string): Promise<ListSummary[]> {
    const listRows = await this.db
      .select()
      .from(movieLists)
      .where(eq(movieLists.userId, userId))
      .orderBy(desc(movieLists.createdAt));
    if (listRows.length === 0) return [];

    const itemRows = await this.db
      .select({ listId: movieListItems.listId, movie: movies, addedAt: movieListItems.addedAt })
      .from(movieListItems)
      .innerJoin(movies, eq(movieListItems.movieId, movies.id))
      .innerJoin(movieLists, eq(movieListItems.listId, movieLists.id))
      .where(eq(movieLists.userId, userId))
      .orderBy(desc(movieListItems.addedAt));

    return listRows.map((list) => ({
      id: list.id,
      name: list.name,
      items: itemRows
        .filter((item) => item.listId === list.id)
        .map((item) => toLibraryMovie(item.movie)),
    }));
  }

  async createList(userId: string, name: string): Promise<ListSummary> {
    const [list] = await this.db
      .insert(movieLists)
      .values({ userId, name })
      .returning();
    if (!list) throw new AppError(502, 'LIST_CREATE_FAILED', 'List could not be created.');
    return { id: list.id, name: list.name, items: [] };
  }

  async deleteList(userId: string, listId: string): Promise<void> {
    const deleted = await this.db
      .delete(movieLists)
      .where(and(eq(movieLists.id, listId), eq(movieLists.userId, userId)))
      .returning({ id: movieLists.id });
    if (deleted.length === 0) {
      throw new AppError(404, 'LIST_NOT_FOUND', 'List not found.');
    }
  }

  async addToList(userId: string, listId: string, summary: TmdbSummary): Promise<void> {
    const list = await this.db
      .select({ id: movieLists.id })
      .from(movieLists)
      .where(and(eq(movieLists.id, listId), eq(movieLists.userId, userId)))
      .limit(1);
    if (list.length === 0) throw new AppError(404, 'LIST_NOT_FOUND', 'List not found.');

    const movie = await upsertMovie(this.db, summary);
    const inserted = await this.db
      .insert(movieListItems)
      .values({ listId, movieId: movie.id })
      .onConflictDoNothing()
      .returning({ id: movieListItems.id });
    if (inserted.length === 0) {
      throw new AppError(409, 'ALREADY_IN_LIST', 'Movie is already in this list.');
    }
  }

  async removeFromList(userId: string, listId: string, tmdbId: number): Promise<void> {
    const list = await this.db
      .select({ id: movieLists.id })
      .from(movieLists)
      .where(and(eq(movieLists.id, listId), eq(movieLists.userId, userId)))
      .limit(1);
    if (list.length === 0) throw new AppError(404, 'LIST_NOT_FOUND', 'List not found.');

    const movie = await this.db
      .select({ id: movies.id })
      .from(movies)
      .where(eq(movies.tmdbId, tmdbId))
      .limit(1);
    if (movie.length === 0) throw new AppError(404, 'MOVIE_NOT_FOUND', 'Movie not found.');

    const deleted = await this.db
      .delete(movieListItems)
      .where(and(eq(movieListItems.listId, listId), eq(movieListItems.movieId, movie[0]!.id)))
      .returning({ id: movieListItems.id });
    if (deleted.length === 0) {
      throw new AppError(404, 'MOVIE_NOT_IN_LIST', 'Movie is not in this list.');
    }
  }
}
