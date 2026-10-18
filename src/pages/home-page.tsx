import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';
import AddToListDialog from '../components/AddToListDialog';
import Landing from '../components/Landing';
import PreferenceForm from '../components/PreferenceForm';
import Results from '../components/Results';
import { useLibrary } from '../lib/library-context';
import { recommendationToCard } from '../lib/movie-adapters';
import { useSession } from '../lib/useSession';
import type { MovieCardData, MovieRecommendation, Preferences, RecommendFunction, RecommendationStatus } from '../lib/types';

interface HomePageProps {
  recommend: RecommendFunction;
}

export default function HomePage({ recommend }: HomePageProps): ReactElement {
  const { isAuthed } = useSession();
  const { favoriteIds, toggleFavorite, lists, setLists } = useLibrary();
  const [status, setStatus] = useState<RecommendationStatus>('idle');
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>([]);
  const [error, setError] = useState('');
  const [listDialogMovie, setListDialogMovie] = useState<MovieCardData | null>(null);
  const [libraryError, setLibraryError] = useState('');

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
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <h1 className="sr-only">PopChoice movie recommendations</h1>

      {libraryError && (
        <p role="alert" className="mb-8 rounded-lg border border-destructive/45 bg-destructive/10 px-4 py-3 text-destructive-foreground">
          {libraryError}
        </p>
      )}

      <div className="grid gap-16 sm:gap-20">
        <Landing
          authed={isAuthed}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onAddToList={setListDialogMovie}
        />
        <PreferenceForm onSubmit={handleSubmit} isLoading={status === 'loading'} />
        <Results status={status} recommendations={recommendations.map(recommendationToCard)} error={error} />
      </div>

      {listDialogMovie && (
        <AddToListDialog
          movie={listDialogMovie}
          lists={lists}
          onClose={closeListDialog}
          onListsChanged={setLists}
          onError={setLibraryError}
        />
      )}
    </div>
  );
}
