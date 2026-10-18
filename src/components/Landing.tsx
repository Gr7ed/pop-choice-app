import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { LuSparkles } from 'react-icons/lu';
import MovieRow from './MovieRow';
import EmptyState from './EmptyState';
import { getDiscover } from '../lib/api-client';
import type { DiscoverPayload, MovieCardData } from '../lib/types';

interface LandingProps {
  authed: boolean;
  favoriteIds: number[];
  onToggleFavorite: (movie: MovieCardData) => void;
  onAddToList: (movie: MovieCardData) => void;
}

const sections = [
  { key: 'nowPlaying', title: 'Now playing in theatres' },
  { key: 'trending', title: 'Trending on TMDB' },
  { key: 'topRated', title: 'Top rated of all time' },
] as const;

const isFavoriteIn = (favoriteIds: number[]) => (movie: MovieCardData) =>
  typeof movie.tmdbId === 'number' && favoriteIds.includes(movie.tmdbId);

export default function Landing({ authed, favoriteIds, onToggleFavorite, onAddToList }: LandingProps): ReactElement {
  const [discover, setDiscover] = useState<DiscoverPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDiscover()
      .then((payload) => {
        if (!cancelled) setDiscover(payload);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = isFavoriteIn(favoriteIds);
  const cardActions = { isFavorite, showActions: authed, onToggleFavorite, onAddToList };

  return (
    <section className="grid gap-8" aria-label="Movie highlights">
      <div className="max-w-2xl">
        <p className="text-kicker text-xs">Discover</p>
        <h2 className="mt-2.5 mb-3 font-heading text-2xl text-foreground sm:text-3xl">
          In theatres, trending &amp; top rated
        </h2>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Start from what everyone is watching, then tell us your taste for a personal shortlist.
        </p>
      </div>

      {failed ? (
        <EmptyState icon={<LuSparkles className="size-5" />} role="status">
          Trending picks are unavailable right now.
        </EmptyState>
      ) : (
        sections.map(({ key, title }) => (
          <div className="grid gap-4" key={key}>
            <h3 className="font-heading text-xl text-foreground">{title}</h3>
            <MovieRow movies={discover?.[key] ?? []} label={title} loading={!discover} {...cardActions} />
          </div>
        ))
      )}
    </section>
  );
}
