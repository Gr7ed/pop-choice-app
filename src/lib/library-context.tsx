import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';
import {
  addFavorite,
  addToList as addToListRequest,
  createList as createListRequest,
  deleteList as deleteListRequest,
  getFavoriteMovies,
  getLists,
  removeFavorite,
  removeFromList as removeFromListRequest,
} from './api-client';
import { useSession } from './useSession';
import type { LibraryMovie, ListSummary, MovieCardData } from './types';

interface LibraryContextValue {
  /** Saved favorites with their full movie metadata. */
  favoriteMovies: LibraryMovie[];
  /** Just the ids, for fast "is this saved?" checks in lists and cards. */
  favoriteIds: number[];
  lists: ListSummary[];
  /** Replace the in-memory lists, e.g. after the add-to-list dialog mutates them. */
  setLists: Dispatch<SetStateAction<ListSummary[]>>;
  /** True while the first library fetch for the current user is in flight. */
  loading: boolean;
  /** True once the first fetch settles, so pages can distinguish empty from loading. */
  ready: boolean;
  error: string;
  clearError: () => void;
  isFavorite: (movie: MovieCardData) => boolean;
  toggleFavorite: (movie: MovieCardData) => Promise<void>;
  addMovieToList: (listId: string, movie: MovieCardData) => Promise<void>;
  removeMovieFromList: (listId: string, tmdbId: number) => Promise<void>;
  createList: (name: string) => Promise<ListSummary>;
  deleteList: (listId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

const FALLBACK_ERROR = 'We couldn’t update your library right now.';

const optimisticFavorite = (movie: MovieCardData, tmdbId: number): LibraryMovie => ({
  tmdbId,
  title: movie.title,
  releaseYear: typeof movie.releaseYear === 'string' ? Number(movie.releaseYear) || null : movie.releaseYear ?? null,
  posterUrl: movie.posterUrl ?? '',
  voteAverage: movie.voteAverage ?? null,
  overview: movie.content ?? movie.overview ?? null,
});

/**
 * Owns favorites and lists for a single signed-in user. Mounted with a `key`
 * per user id, so switching accounts remounts it and state can never leak
 * between sessions. Favorites update optimistically and roll back on failure.
 */
function LibraryStore({ userId, children }: { userId?: string; children: ReactNode }): ReactElement {
  const [favoriteMovies, setFavoriteMovies] = useState<LibraryMovie[]>([]);
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [ready, setReady] = useState(!userId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([getFavoriteMovies(), getLists()])
      .then(([favorites, userLists]) => {
        if (cancelled) return;
        setFavoriteMovies(favorites);
        setLists(userLists);
      })
      .catch(() => {
        if (!cancelled) setError('We couldn’t load your library right now.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const favoriteIds = useMemo(() => favoriteMovies.map((movie) => movie.tmdbId), [favoriteMovies]);

  const isFavorite = useCallback(
    (movie: MovieCardData) => typeof movie.tmdbId === 'number' && favoriteIds.includes(movie.tmdbId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (movie: MovieCardData) => {
      if (typeof movie.tmdbId !== 'number') return;
      const tmdbId = movie.tmdbId;
      const previous = favoriteMovies;
      const wasFavorite = previous.some((entry) => entry.tmdbId === tmdbId);
      setError('');

      setFavoriteMovies(
        wasFavorite
          ? previous.filter((entry) => entry.tmdbId !== tmdbId)
          : [...previous, optimisticFavorite(movie, tmdbId)],
      );

      try {
        if (wasFavorite) {
          await removeFavorite(tmdbId);
        } else {
          await addFavorite(movie);
        }
        setFavoriteMovies(await getFavoriteMovies());
      } catch (requestError) {
        setFavoriteMovies(previous);
        setError(requestError instanceof Error ? requestError.message : FALLBACK_ERROR);
      }
    },
    [favoriteMovies],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [favorites, userLists] = await Promise.all([getFavoriteMovies(), getLists()]);
      setFavoriteMovies(favorites);
      setLists(userLists);
    } catch {
      setError('We couldn’t refresh your library right now.');
    }
  }, [userId]);

  const addMovieToList = useCallback(async (listId: string, movie: MovieCardData) => {
    await addToListRequest(listId, movie);
    setLists(await getLists());
  }, []);

  const removeMovieFromList = useCallback(
    async (listId: string, tmdbId: number) => {
      const previous = lists;
      setLists((current) =>
        current.map((list) =>
          list.id === listId ? { ...list, items: list.items.filter((item) => item.tmdbId !== tmdbId) } : list,
        ),
      );
      try {
        await removeFromListRequest(listId, tmdbId);
      } catch (requestError) {
        setLists(previous);
        setError(requestError instanceof Error ? requestError.message : FALLBACK_ERROR);
      }
    },
    [lists],
  );

  const createList = useCallback(async (name: string) => {
    const list = await createListRequest(name);
    setLists((current) => [...current, list]);
    return list;
  }, []);

  const deleteList = useCallback(
    async (listId: string) => {
      const previous = lists;
      setLists((current) => current.filter((list) => list.id !== listId));
      try {
        await deleteListRequest(listId);
      } catch (requestError) {
        setLists(previous);
        setError(requestError instanceof Error ? requestError.message : FALLBACK_ERROR);
      }
    },
    [lists],
  );

  const clearError = useCallback(() => setError(''), []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      favoriteMovies,
      favoriteIds,
      lists,
      setLists,
      loading,
      ready,
      error,
      clearError,
      isFavorite,
      toggleFavorite,
      addMovieToList,
      removeMovieFromList,
      createList,
      deleteList,
      refresh,
    }),
    [
      favoriteMovies,
      favoriteIds,
      lists,
      loading,
      ready,
      error,
      clearError,
      isFavorite,
      toggleFavorite,
      addMovieToList,
      removeMovieFromList,
      createList,
      deleteList,
      refresh,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

/** Shares the signed-in user's favorites and lists across every route. */
export function LibraryProvider({ children }: { children: ReactNode }): ReactElement {
  const { user } = useSession();
  return (
    <LibraryStore key={user?.id ?? 'guest'} userId={user?.id}>
      {children}
    </LibraryStore>
  );
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside a LibraryProvider.');
  return context;
}
