import { bigint, bigserial, date, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { vector1536 } from './vector';

export const movies = pgTable(
  'movies',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tmdbId: bigint('tmdb_id', { mode: 'number' }).notNull().unique(),
    title: text('title').notNull(),
    overview: text('overview'),
    releaseDate: date('release_date'),
    releaseYear: integer('release_year'),
    posterPath: text('poster_path'),
    backdropPath: text('backdrop_path'),
    voteAverage: doublePrecision('vote_average'),
    voteCount: integer('vote_count'),
    popularity: doublePrecision('popularity'),
    genres: jsonb('genres').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    index('movies_title_idx').on(table.title),
    index('movies_vote_average_idx').on(table.voteAverage),
  ],
);

export const movieChunks = pgTable(
  'movie_chunks',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    contentHash: text('content_hash').notNull().unique(),
    embedding: vector1536('embedding').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('movie_chunks_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops'))],
);

export const favorites = pgTable(
  'favorites',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('favorites_user_movie_idx').on(table.userId, table.movieId)],
);

export const movieLists = pgTable(
  'movie_lists',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [index('movie_lists_user_idx').on(table.userId)],
);

export const movieListItems = pgTable(
  'movie_list_items',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    listId: text('list_id')
      .notNull()
      .references(() => movieLists.id, { onDelete: 'cascade' }),
    movieId: bigint('movie_id', { mode: 'number' })
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('movie_list_items_list_movie_idx').on(table.listId, table.movieId),
  ],
);

export const recommendationRequests = pgTable(
  'recommendation_requests',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    favoriteMovie: text('favorite_movie').notNull(),
    mood: text('mood').notNull(),
    favoriteGenre: text('favorite_genre').notNull(),
    status: text('status', { enum: ['pending', 'completed', 'failed'] }).notNull().default('pending'),
    model: text('model'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('recommendation_requests_user_created_idx').on(table.userId, table.createdAt)],
);

export const recommendationResults = pgTable(
  'recommendation_results',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    requestId: text('request_id')
      .notNull()
      .references(() => recommendationRequests.id, { onDelete: 'cascade' }),
    movieId: bigint('movie_id', { mode: 'number' }).references(() => movies.id, { onDelete: 'set null' }),
    rank: integer('rank').notNull(),
    title: text('title').notNull(),
    releaseYear: text('release_year').notNull(),
    content: text('content').notNull(),
    posterUrl: text('poster_url'),
    tmdbId: bigint('tmdb_id', { mode: 'number' }),
  },
  (table) => [uniqueIndex('recommendation_results_request_rank_idx').on(table.requestId, table.rank)],
);
