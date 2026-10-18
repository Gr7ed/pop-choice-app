import MovieCard from './MovieCard';
import { EmptyState, Spinner } from './ui';
import type { ResultsProps } from '../lib/types';
import type { ReactElement } from 'react';

export default function Results({ status, recommendations, error }: ResultsProps): ReactElement {
  if (status === 'idle') {
    return (
      <EmptyState className="results" label="Recommendations" icon="✦">
        Your personalized picks will appear here.
      </EmptyState>
    );
  }

  if (status === 'loading') {
    return (
      <EmptyState className="results" live="polite" busy icon={<Spinner variant="orbit" />}>
        Reading your taste and searching the shelves…
      </EmptyState>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        className="results"
        role="alert"
        tone="error"
        icon="!"
        hint="Check your connection or try a different set of preferences."
      >
        {error}
      </EmptyState>
    );
  }

  if (!recommendations.length) {
    return (
      <EmptyState className="results" live="polite" icon="◎" hint="Try broadening your mood or genre.">
        No close matches this time.
      </EmptyState>
    );
  }

  return (
    <section className="results" aria-labelledby="results-heading">
      <div className="results-heading">
        <div>
          <p className="section-kicker">The shortlist</p>
          <h2 id="results-heading" className="section-title section-title-md results-title">Made for your movie night</h2>
        </div>
        <span>{recommendations.length} picks</span>
      </div>
      <div className="movie-grid">
        {recommendations.map((movie, index) => (
          <MovieCard key={`${movie.title}-${movie.releaseYear}`} movie={movie} index={index} />
        ))}
      </div>
    </section>
  );
}
