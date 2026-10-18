import type { LibraryMovie, MovieCardData, MovieRecommendation } from './types';

/** Shape a model recommendation into the card data the movie grid expects. */
export const recommendationToCard = (movie: MovieRecommendation): MovieCardData => ({
  title: movie.title,
  releaseYear: movie.releaseYear,
  posterUrl: movie.posterUrl ?? null,
  content: movie.content,
  tmdbId: movie.tmdbId,
  voteAverage: movie.tmdbId ? movie.voteAverage ?? null : null,
});

/** Shape a persisted library row into the same card data shape. */
export const libraryMovieToCard = (movie: LibraryMovie): MovieCardData => ({
  title: movie.title,
  releaseYear: movie.releaseYear,
  posterUrl: movie.posterUrl || null,
  content: movie.overview,
  tmdbId: movie.tmdbId,
  voteAverage: movie.voteAverage,
});
