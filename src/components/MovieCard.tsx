import { createElement, useId, useState } from 'react';
import type { ReactElement } from 'react';
import { LuHeart, LuPlus, LuStar, LuTrash2 } from 'react-icons/lu';
import type { MovieCardProps } from '../lib/types';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';

/** Characters before the description is worth collapsing behind "Show more". */
const EXPAND_THRESHOLD = 160;

/**
 * Presentational movie card shared by the discover rows, the recommendation
 * shortlist, favorites and saved lists. The layout is a flex column so text
 * wraps instead of overflowing; long blurbs clamp to three lines and expand
 * on demand.
 */
export default function MovieCard({
  movie,
  index,
  headingLevel = 3,
  isFavorite,
  showActions,
  onToggleFavorite,
  onAddToList,
  onRemove,
  removeLabel = 'Remove',
}: MovieCardProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  const year = movie.releaseYear ? String(movie.releaseYear) : null;
  const rating = typeof movie.voteAverage === 'number' && movie.voteAverage > 0 ? movie.voteAverage.toFixed(1) : null;
  const hasActions = Boolean(showActions && (onAddToList || onRemove));
  const blurb = (movie.content || movie.overview || '').replace(/\s+/g, ' ').trim();
  const canExpand = blurb.length > EXPAND_THRESHOLD;

  const title = createElement(
    `h${headingLevel}`,
    { className: 'font-heading text-base leading-snug text-foreground' },
    movie.title,
  );

  return (
    <Card className="group/card gap-3 p-3 ring-border/70 transition duration-200 hover:-translate-y-1 hover:bg-card/90 hover:ring-primary/40 hover:shadow-xl hover:shadow-black/30 focus-within:ring-primary/40">
      <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-[linear-gradient(145deg,#25376b,#111e45)]">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-4xl" aria-hidden="true">
            🎬
          </div>
        )}

        {rating && (
          <Badge variant="secondary" className="absolute top-2 right-2 bg-background/80 text-rating backdrop-blur-sm" title="TMDB average rating">
            <LuStar className="size-3 fill-current" aria-hidden="true" />
            {rating}
          </Badge>
        )}

        {showActions && onToggleFavorite && (
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            onClick={() => onToggleFavorite(movie)}
            aria-pressed={Boolean(isFavorite)}
            aria-label={`${isFavorite ? 'Remove' : 'Add'} ${movie.title} ${isFavorite ? 'from' : 'to'} favorites`}
            className={cn(
              'absolute top-2 left-2 bg-background/80 backdrop-blur-sm transition-colors hover:bg-background',
              isFavorite && 'text-primary',
            )}
          >
            <LuHeart className={cn('size-4', isFavorite && 'fill-current')} aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-1">
        {typeof index === 'number' && (
          <p className="text-kicker text-xs">Pick {String(index + 1).padStart(2, '0')}</p>
        )}

        {title}

        {year && <p className="text-sm font-bold text-primary">{year}</p>}

        {blurb && (
          <>
            <p id={contentId} className={cn('text-sm leading-relaxed text-muted-foreground', expanded ? 'is-expanded' : 'line-clamp-3')}>
              {blurb}
            </p>
            {canExpand && (
              <button
                type="button"
                className="inline-flex w-fit items-center gap-1 text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                aria-expanded={expanded}
                aria-controls={contentId}
                aria-label={`${expanded ? 'Show less' : 'Show more'} about ${movie.title}`}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? 'Show less' : 'Show more'}
                <span aria-hidden="true" className={cn('transition-transform', expanded && 'rotate-180')}>
                  ⌄
                </span>
              </button>
            )}
          </>
        )}

        {hasActions && (
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            {onAddToList && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddToList(movie)}
                aria-label={`Add ${movie.title} to a list`}
              >
                <LuPlus aria-hidden="true" /> Add to list
              </Button>
            )}
            {onRemove && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemove(movie)}
                aria-label={`${removeLabel} ${movie.title}`}
              >
                <LuTrash2 aria-hidden="true" /> {removeLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
