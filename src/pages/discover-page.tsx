import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { LuCompass, LuTriangleAlert } from 'react-icons/lu';
import { useSearchParams } from 'react-router-dom';
import AddToListDialog from '../components/AddToListDialog';
import EmptyState from '../components/EmptyState';
import MovieCard from '../components/MovieCard';
import MovieFilters from '../components/MovieFilters';
import Pagination from '../components/Pagination';
import PageHeader from '../components/layout/page-header';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { discoverMovies, getNowPlaying } from '../lib/api-client';
import { readDiscoverState, toDiscoverSearchParams } from '../lib/discover-params';
import type { DiscoverTab } from '../lib/discover-params';
import { useLibrary } from '../lib/library-context';
import { useSession } from '../lib/useSession';
import type { MovieCardData, MovieFilters as MovieFiltersValue, MoviePage } from '../lib/types';

/** A response kept together with the URL state that produced it. */
interface LoadedMovies {
  requestKey: string;
  tab: DiscoverTab;
  movies: MoviePage;
}

const tabs: Array<{ id: DiscoverTab; label: string }> = [
  { id: 'discover', label: 'Filter & sort' },
  { id: 'nowPlaying', label: 'Now playing' },
];

function ResultsSkeleton(): ReactElement {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-5" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-border/70">
          <Skeleton className="aspect-2/3 w-full rounded-lg" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

/**
 * Browse the TMDB catalogue with `/discover/movie` filters, sorting and
 * pagination, or the current theatrical releases. Rows reuse the same
 * favourite / add-to-list actions as the rest of the app.
 */
export default function DiscoverPage(): ReactElement {
  const { isAuthed } = useSession();
  const { favoriteIds, toggleFavorite, lists, setLists } = useLibrary();

  const [searchParams, setSearchParams] = useSearchParams();
  const { tab, filters, page } = useMemo(() => readDiscoverState(searchParams), [searchParams]);

  const [result, setResult] = useState<LoadedMovies | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [listDialogMovie, setListDialogMovie] = useState<MovieCardData | null>(null);
  const [libraryError, setLibraryError] = useState('');

  /** Identifies the current tab/filter/page combination, including the URL state. */
  const requestKey = JSON.stringify([tab, filters, page]);

  const loading = result?.requestKey !== requestKey && errorKey !== requestKey;
  const failed = errorKey === requestKey;
  // Keep the previous page visible while filters/page load, but never show the
  // other tab's results when the tab changes.
  const data = result?.tab === tab ? result.movies : null;

  useEffect(() => {
    let cancelled = false;

    const request = tab === 'nowPlaying' ? getNowPlaying(page) : discoverMovies(filters, page);

    request
      .then((movies) => {
        if (cancelled) return;
        setResult({ requestKey, tab, movies });
        setErrorKey(null);
      })
      .catch(() => {
        if (cancelled) return;
        setErrorKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, filters, page, requestKey]);

  /** Keep the URL as the source of truth so sharing it restores the same view. */
  const updateUrl = useCallback(
    (next: { tab?: DiscoverTab; filters?: MovieFiltersValue; page?: number }) => {
      setSearchParams(
        toDiscoverSearchParams({
          tab: next.tab ?? tab,
          filters: next.filters ?? filters,
          page: next.page ?? page,
        }),
        { replace: true },
      );
    },
    [filters, page, setSearchParams, tab],
  );

  const selectTab = (next: DiscoverTab) => {
    if (next === tab) return;
    updateUrl({ tab: next, page: 1 });
  };

  const applyFilters = (next: MovieFiltersValue) => {
    updateUrl({ filters: next, page: 1 });
  };

  const goToPage = (next: number) => {
    if (next === page) return;
    updateUrl({ page: next });
  };

  const closeListDialog = useCallback(() => setListDialogMovie(null), []);

  const movies = data?.results ?? [];
  const isFavorite = (movie: MovieCardData) =>
    typeof movie.tmdbId === 'number' && favoriteIds.includes(movie.tmdbId);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <PageHeader
        kicker="Browse the catalogue"
        title="Discover movies"
        description="Filter and sort TMDB's catalogue, or jump straight to what's in theatres this week."
        action={
          data ? (
            <span className="text-sm whitespace-nowrap text-muted-foreground">
              {data.totalResults.toLocaleString()} movies
            </span>
          ) : undefined
        }
      />

      {libraryError && (
        <p role="alert" className="rounded-lg border border-destructive/45 bg-destructive/10 px-4 py-3 text-destructive-foreground">
          {libraryError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Browse mode">
        {tabs.map(({ id, label }) => (
          <Button
            key={id}
            type="button"
            variant={tab === id ? 'default' : 'outline'}
            size="sm"
            aria-pressed={tab === id}
            onClick={() => selectTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === 'discover' && <MovieFilters value={filters} onChange={applyFilters} disabled={loading} />}

      <section aria-label="Movie results" aria-busy={loading || undefined} className="grid gap-6">
        {failed ? (
          <EmptyState icon={<LuTriangleAlert className="size-5" />} tone="error" role="alert">
            We couldn’t load these movies right now.
          </EmptyState>
        ) : loading && !data ? (
          <ResultsSkeleton />
        ) : movies.length === 0 ? (
          <EmptyState icon={<LuCompass className="size-5" />} hint="Try clearing a filter or two.">
            No movies match these filters.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-5">
            {movies.map((movie) => (
              <MovieCard
                key={movie.tmdbId}
                movie={movie}
                showActions={isAuthed}
                isFavorite={isFavorite(movie)}
                onToggleFavorite={toggleFavorite}
                onAddToList={setListDialogMovie}
              />
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={goToPage}
            disabled={loading}
          />
        )}
      </section>

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
