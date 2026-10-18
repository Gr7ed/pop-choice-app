import { createElement, useId, useState } from 'react';
import type { ReactElement } from 'react';
import type { MovieCardProps } from '../lib/types';
import { Button } from './ui';

/** Characters before the description is worth collapsing behind "Show more". */
const EXPAND_THRESHOLD = 160;

/**
 * Presentational movie card shared by the discover rows and the recommendation
 * shortlist. The layout is a flex column so text wraps instead of overflowing;
 * long descriptions are clamped to three lines and expand on demand.
 */
export default function MovieCard({
  movie,
  index,
  headingLevel = 3,
  isFavorite,
  showActions,
  onToggleFavorite,
  onAddToList,
}: MovieCardProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  const year = movie.releaseYear ? String(movie.releaseYear) : null;
  const rating = typeof movie.voteAverage === 'number' && movie.voteAverage > 0 ? movie.voteAverage.toFixed(1) : null;
  const hasActions = Boolean(showActions && (onToggleFavorite || onAddToList));
  const blurb = (movie.content || movie.overview || '').replace(/\s+/g, ' ').trim();
  const canExpand = blurb.length > EXPAND_THRESHOLD;

  const title = createElement(`h${headingLevel}`, { className: 'movie-title' }, movie.title);

  return (
    <article className="movie-card">
      <div className="movie-poster-frame">
        {movie.posterUrl
          ? <img className="movie-poster" src={movie.posterUrl} alt={`${movie.title} poster`} loading="lazy" />
          : <div className="poster-placeholder" aria-hidden="true">🎬</div>}
        {rating && <span className="movie-badge" title="TMDB average rating">★ {rating}</span>}
      </div>
      <div className="movie-info">
        {typeof index === 'number' && (
          <p className="movie-number">Pick {String(index + 1).padStart(2, '0')}</p>
        )}
        {title}
        {year && <p className="movie-year">{year}</p>}
        {blurb && (
          <>
            <p id={contentId} className={`movie-content${expanded ? ' is-expanded' : ''}`}>{blurb}</p>
            {canExpand && (
              <button
                type="button"
                className="movie-toggle"
                aria-expanded={expanded}
                aria-controls={contentId}
                aria-label={`${expanded ? 'Show less' : 'Show more'} about ${movie.title}`}
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded ? 'Show less' : 'Show more'}
                <span className="movie-toggle__icon" aria-hidden="true">⌄</span>
              </button>
            )}
          </>
        )}
        {hasActions && (
          <div className="movie-actions">
            <Button
              variant="ghost"
              className={isFavorite ? 'is-active' : ''}
              onClick={() => onToggleFavorite?.(movie)}
              aria-pressed={Boolean(isFavorite)}
              aria-label={`${isFavorite ? 'Remove' : 'Add'} ${movie.title} ${isFavorite ? 'from' : 'to'} favorites`}
            >
              {isFavorite ? '♥ Favorited' : '♡ Favorite'}
            </Button>
            {onAddToList && (
              <Button variant="ghost" onClick={() => onAddToList(movie)} aria-label={`Add ${movie.title} to a list`}>
                + Add to list
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
