import { useCallback, useEffect, useState } from 'react';
import { getRecommendations } from './lib/recommendationService';
import { addFavorite, getFavorites, getLists, removeFavorite } from './lib/api-client';
import { useSession } from './lib/useSession';
import AddToListDialog from './components/AddToListDialog';
import AuthPage from './components/AuthPage';
import Brand from './components/Brand';
import Landing from './components/Landing';
import PreferenceForm from './components/PreferenceForm';
import Results from './components/Results';
import type {
  AppProps,
  ListSummary,
  MovieCardData,
  MovieRecommendation,
  Preferences,
  RecommendationStatus,
} from './lib/types';

export default function App({ recommend = getRecommendations }: AppProps) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (currentPath === '/signin' || currentPath === '/login') {
    return <AuthPage mode="login" />;
  }
  if (currentPath === '/signup') {
    return <AuthPage mode="signup" />;
  }

  return <RecommendationApp recommend={recommend} />;
}

const toCardData = (movie: MovieRecommendation): MovieCardData => ({
  title: movie.title,
  releaseYear: movie.releaseYear,
  posterUrl: movie.posterUrl ?? null,
  content: movie.content,
  tmdbId: movie.tmdbId,
  voteAverage: movie.tmdbId ? movie.voteAverage ?? null : null,
});

function RecommendationApp({ recommend }: Required<AppProps>) {
  const { user, isAuthed } = useSession();
  const userId = user?.id;
  const [status, setStatus] = useState<RecommendationStatus>('idle');
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [error, setError] = useState('');
  const [libraryError, setLibraryError] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [listDialogMovie, setListDialogMovie] = useState<MovieCardData | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([getFavorites(), getLists()])
      .then(([favorites, userLists]) => {
        if (cancelled) return;
        setFavoriteIds(favorites);
        setLists(userLists);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleFavorite = async (movie: MovieCardData) => {
    if (typeof movie.tmdbId !== 'number') return;
    const wasFavorite = favoriteIds.includes(movie.tmdbId);
    setFavoriteIds(wasFavorite ? favoriteIds.filter((id) => id !== movie.tmdbId) : [...favoriteIds, movie.tmdbId]);
    setLibraryError('');
    try {
      if (wasFavorite) {
        await removeFavorite(movie.tmdbId);
      } else {
        await addFavorite(movie);
      }
      setFavoriteIds(await getFavorites());
    } catch (requestError) {
      setFavoriteIds(wasFavorite ? [...favoriteIds, movie.tmdbId] : favoriteIds.filter((id) => id !== movie.tmdbId));
      setLibraryError(requestError instanceof Error ? requestError.message : 'Could not update this favorite.');
    }
  };

  const openListDialog = useCallback((movie: MovieCardData) => setListDialogMovie(movie), []);
  const closeListDialog = useCallback(() => setListDialogMovie(null), []);

  const handleSubmit = async (preferences: Preferences) => {
    setStatus('loading');
    setError('');
    try {
      setRecommendations(await recommend(preferences));
      setStatus('success');
    } catch (requestError) {
      console.error(requestError);
      setStatus('error');
      setError('We couldn’t find your recommendations right now.');
    }
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Brand />
      <main className="main-content" id="main-content">
        <h1 className="visually-hidden">PopChoice movie recommendations</h1>
        {libraryError && <p className="alert alert-danger" role="alert">{libraryError}</p>}
        <Landing
          authed={isAuthed}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onAddToList={openListDialog}
        />
        <PreferenceForm onSubmit={handleSubmit} isLoading={status === 'loading'} />
        <Results
          status={status}
          recommendations={recommendations.map(toCardData)}
          error={error}
        />
      </main>
      {listDialogMovie && (
        <AddToListDialog
          movie={listDialogMovie}
          lists={lists}
          onClose={closeListDialog}
          onListsChanged={setLists}
          onError={setLibraryError}
        />
      )}
      <footer>PopChoice <span aria-hidden="true">•</span> made for curious movie people</footer>
    </div>
  );
}
