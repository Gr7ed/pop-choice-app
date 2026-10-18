import type { ReactElement } from 'react';
import MovieCard from './MovieCard';
import type { MovieCardProps, MovieCardData } from '../lib/types';

interface MovieRowProps {
  movies: MovieCardData[];
  /** Accessible name describing the row, e.g. "Trending on TMDB". */
  label: string;
  headingLevel?: MovieCardProps['headingLevel'];
  /** Renders shimmering placeholder cards instead of content. */
  loading?: boolean;
  skeletonCount?: number;
  isFavorite?: (movie: MovieCardData) => boolean;
  showActions?: boolean;
  onToggleFavorite?: (movie: MovieCardData) => void;
  onAddToList?: (movie: MovieCardData) => void;
}

const cardKey = (movie: MovieCardData) => movie.tmdbId ?? `${movie.title}-${movie.releaseYear ?? ''}`;

function MovieCardSkeleton(): ReactElement {
  return (
    <article className="movie-card movie-card--skeleton" aria-hidden="true">
      <div className="movie-poster-frame skeleton" />
      <div className="movie-info">
        <span className="skeleton skeleton-line skeleton-line--sm" />
        <span className="skeleton skeleton-line skeleton-line--lg" />
        <span className="skeleton skeleton-line" />
        <span className="skeleton skeleton-line" />
      </div>
    </article>
  );
}

/**
 * Horizontally scrolling flex strip of movie cards. Cards keep a fixed flex
 * basis and snap while scrolling, so their content never squashes. It is
 * focusable and labelled so keyboard and screen-reader users can reach it.
 */
export default function MovieRow({
  movies,
  label,
  headingLevel = 4,
  loading = false,
  skeletonCount = 5,
  isFavorite,
  showActions,
  onToggleFavorite,
  onAddToList,
}: MovieRowProps): ReactElement {
  return (
    <div className="movie-row" role="region" aria-label={label} aria-busy={loading || undefined} tabIndex={0}>
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <MovieCardSkeleton key={i} />)
        : movies.map((movie) => (
            <MovieCard
              key={cardKey(movie)}
              movie={movie}
              headingLevel={headingLevel}
              isFavorite={isFavorite?.(movie)}
              showActions={showActions}
              onToggleFavorite={onToggleFavorite}
              onAddToList={onAddToList}
            />
          ))}
    </div>
  );
}
