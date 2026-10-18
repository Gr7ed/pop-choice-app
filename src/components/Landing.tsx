import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import MovieCard from './MovieCard';
import { getDiscover } from '../lib/api-client';
import type { DiscoverPayload, MovieCardData } from '../lib/types';

interface LandingProps {
  authed: boolean;
  favoriteIds: number[];
  onToggleFavorite: (movie: MovieCardData) => void;
  onAddToList: (movie: MovieCardData) => void;
}

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

  if (failed || !discover) {
    if (failed) {
      return (
        <section className="landing empty-state" aria-label="Trending movies">
          <span aria-hidden="true">✦</span>
          <p>Trending picks are unavailable right now.</p>
        </section>
      );
    }
    return (
      <section className="landing empty-state" aria-label="Trending movies">
        <span className="loading-orbit" aria-hidden="true" />
        <p>Loading trending picks from TMDB…</p>
      </section>
    );
  }

  const isFavorite = (movie: MovieCardData) =>
    typeof movie.tmdbId === 'number' && favoriteIds.includes(movie.tmdbId);

  return (
    <section className="landing" aria-label="Trending movies">
      <div className="landing-heading">
        <p className="section-kicker">Discover</p>
        <h2 className="landing-title">Trending &amp; top rated right now</h2>
        <p>Start from what everyone is watching, then tell us your taste for a personal shortlist.</p>
      </div>
      <div className="landing-section">
        <h3>Trending on TMDB</h3>
        <div className="movie-row">
          {discover.trending.map((movie) => (
            <MovieCard
              key={movie.tmdbId}
              movie={movie}
              isFavorite={isFavorite(movie)}
              showActions={authed}
              onToggleFavorite={onToggleFavorite}
              onAddToList={onAddToList}
            />
          ))}
        </div>
      </div>
      <div className="landing-section">
        <h3>Top rated of all time</h3>
        <div className="movie-row">
          {discover.topRated.map((movie) => (
            <MovieCard
              key={movie.tmdbId}
              movie={movie}
              isFavorite={isFavorite(movie)}
              showActions={authed}
              onToggleFavorite={onToggleFavorite}
              onAddToList={onAddToList}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
