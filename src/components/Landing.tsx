import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import MovieRow from './MovieRow';
import { EmptyState } from './ui';
import { getDiscover } from '../lib/api-client';
import type { DiscoverPayload, MovieCardData } from '../lib/types';

interface LandingProps {
  authed: boolean;
  favoriteIds: number[];
  onToggleFavorite: (movie: MovieCardData) => void;
  onAddToList: (movie: MovieCardData) => void;
}

const sections = [
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
    <section className="landing" aria-label="Trending movies">
      <div className="landing-heading">
        <p className="section-kicker">Discover</p>
        <h2 className="section-title section-title-md landing-title">Trending &amp; top rated right now</h2>
        <p>Start from what everyone is watching, then tell us your taste for a personal shortlist.</p>
      </div>
      {failed ? (
        <EmptyState className="landing" icon="✦" role="status">
          Trending picks are unavailable right now.
        </EmptyState>
      ) : (
        sections.map(({ key, title }) => (
          <div className="landing-section" key={key}>
            <h3 className="landing-subtitle">{title}</h3>
            <MovieRow movies={discover?.[key] ?? []} label={title} loading={!discover} {...cardActions} />
          </div>
        ))
      )}
    </section>
  );
}
