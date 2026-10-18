import type { ReactElement } from 'react';
import MovieCard from './MovieCard';
import { Skeleton } from './ui/skeleton';
import { cn } from '../lib/utils';
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
    <article className="flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-border/70" aria-hidden="true">
      <Skeleton className="aspect-2/3 w-full rounded-lg" />
      <div className="flex flex-col gap-2 px-1 pb-1">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </article>
  );
}

/**
 * Horizontally scrolling strip of movie cards. Cards keep a fixed basis and
 * snap while scrolling, so their content never squashes. It is focusable and
 * labelled so keyboard and screen-reader users can reach it.
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
    <div
      role="region"
      aria-label={label}
      aria-busy={loading || undefined}
      tabIndex={0}
      className={cn(
        'flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden rounded-2xl px-2 pt-2 pb-2',
        'scrollbar-none overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        '*:shrink-0 *:basis-[clamp(170px,42vw,220px)] *:snap-start',
      )}
    >
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
