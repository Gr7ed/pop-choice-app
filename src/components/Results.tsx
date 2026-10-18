import { LuCircleAlert, LuSearchX, LuSparkles } from 'react-icons/lu';
import MovieCard from './MovieCard';
import EmptyState from './EmptyState';
import Spinner from './ui/spinner';
import type { ResultsProps } from '../lib/types';
import type { ReactElement } from 'react';

export default function Results({ status, recommendations, error }: ResultsProps): ReactElement {
  if (status === 'idle') {
    return (
      <EmptyState label="Recommendations" icon={<LuSparkles className="size-5" />}>
        Your personalized picks will appear here.
      </EmptyState>
    );
  }

  if (status === 'loading') {
    return (
      <EmptyState live="polite" busy icon={<Spinner className="size-5" />}>
        Reading your taste and searching the shelves…
      </EmptyState>
    );
  }

  if (status === 'error') {
    return (
      <EmptyState
        role="alert"
        tone="error"
        icon={<LuCircleAlert className="size-5" />}
        hint="Check your connection or try a different set of preferences."
      >
        {error}
      </EmptyState>
    );
  }

  if (!recommendations.length) {
    return (
      <EmptyState live="polite" icon={<LuSearchX className="size-5" />} hint="Try broadening your mood or genre.">
        No close matches this time.
      </EmptyState>
    );
  }

  return (
    <section className="grid gap-6" aria-labelledby="results-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-kicker text-xs">The shortlist</p>
          <h2 id="results-heading" className="mt-2 font-heading text-2xl text-foreground sm:text-3xl">
            Made for your movie night
          </h2>
        </div>
        <span className="text-sm whitespace-nowrap text-muted-foreground">{recommendations.length} picks</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-5">
        {recommendations.map((movie, index) => (
          <MovieCard key={`${movie.title}-${movie.releaseYear}`} movie={movie} index={index} />
        ))}
      </div>
    </section>
  );
}
