import type { MovieCardProps } from '../lib/types';
import type { ReactElement } from 'react';

export default function MovieCard({
  movie,
  index,
  isFavorite,
  showActions,
  onToggleFavorite,
  onAddToList,
}: MovieCardProps): ReactElement {
  const year = movie.releaseYear ? String(movie.releaseYear) : null;
  const rating = typeof movie.voteAverage === 'number' && movie.voteAverage > 0 ? movie.voteAverage.toFixed(1) : null;
  const hasActions = Boolean(showActions && (onToggleFavorite || onAddToList));
  const blurb = movie.content || movie.overview;
  return (
    <article className="movie-card">
      {movie.posterUrl
        ? <img className="movie-poster" src={movie.posterUrl} alt={`${movie.title} poster`} loading="lazy" />
        : <div className="poster-placeholder" aria-hidden="true">🎬</div>}
      <div className="movie-info">
        <p className="movie-number">
          {typeof index === 'number' ? `Pick ${String(index + 1).padStart(2, '0')}` : 'TMDB pick'}
          {rating && <span className="movie-rating" title="TMDB average rating">★ {rating}</span>}
        </p>
        <h3>{movie.title}</h3>
        {year && <p className="movie-year">{year}</p>}
        {blurb && <p className="movie-content">{blurb}</p>}
        {hasActions && (
          <div className="movie-actions">
            <button
              type="button"
              className={`card-action${isFavorite ? ' active' : ''}`}
              onClick={() => onToggleFavorite?.(movie)}
              aria-pressed={Boolean(isFavorite)}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '♥ Favorited' : '♡ Favorite'}
            </button>
            {onAddToList && (
              <button type="button" className="card-action" onClick={() => onAddToList(movie)}>
                + Add to list
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
