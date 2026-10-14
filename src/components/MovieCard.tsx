import type { MovieCardProps } from '../lib/types';
import type { ReactElement } from 'react';

export default function MovieCard({ movie, index }: MovieCardProps): ReactElement {
  return (
    <article className="movie-card">
      {movie.posterUrl ? <img className="movie-poster" src={movie.posterUrl} alt={`${movie.title} poster`} /> : <div className="poster-placeholder" aria-hidden="true">🎬</div>}
      <div className="movie-info">
        <p className="movie-number">Pick {String(index + 1).padStart(2, '0')}</p>
        <h2>{movie.title}</h2>
        <p className="movie-year">{movie.releaseYear}</p>
        <p className="movie-content">{movie.content}</p>
      </div>
    </article>
  );
}
