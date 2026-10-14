import MovieCard from './MovieCard';
import type { ResultsProps } from '../lib/types';
import type { ReactElement } from 'react';

export default function Results({ status, recommendations, error }: ResultsProps): ReactElement {
  if (status === 'idle') return <section className="results empty-state" aria-label="Recommendations"><span aria-hidden="true">✦</span><p>Your personalized picks will appear here.</p></section>;
  if (status === 'loading') return <section className="results empty-state" aria-live="polite"><span className="loading-orbit" aria-hidden="true" /><p>Reading your taste and searching the shelves…</p></section>;
  if (status === 'error') return <section className="results empty-state error-state" role="alert"><span aria-hidden="true">!</span><p>{error}</p><small>Check your connection or try a different set of preferences.</small></section>;
  if (!recommendations.length) return <section className="results empty-state" aria-live="polite"><span aria-hidden="true">◎</span><p>No close matches this time.</p><small>Try broadening your mood or genre.</small></section>;
  return <section className="results" aria-labelledby="results-heading"><div className="results-heading"><div><p className="section-kicker">The shortlist</p><h2 id="results-heading">Made for your movie night</h2></div><span>{recommendations.length} picks</span></div><div className="movie-grid">{recommendations.map((movie, index) => <MovieCard key={`${movie.title}-${movie.releaseYear}`} movie={movie} index={index} />)}</div></section>;
}
