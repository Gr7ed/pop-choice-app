import type { ReactElement } from 'react';
import { LuHeart } from 'react-icons/lu';
import MovieCard from '../components/MovieCard';
import EmptyState from '../components/EmptyState';
import SignInPrompt from '../components/SignInPrompt';
import PageHeader from '../components/layout/page-header';
import { Skeleton } from '../components/ui/skeleton';
import { useLibrary } from '../lib/library-context';
import { libraryMovieToCard } from '../lib/movie-adapters';
import { useSession } from '../lib/useSession';

function FavoritesSkeleton(): ReactElement {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-5" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-border/70">
          <Skeleton className="aspect-2/3 w-full rounded-lg" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export default function FavoritesPage(): ReactElement {
  const { isAuthed, isPending } = useSession();
  const { favoriteMovies, isFavorite, toggleFavorite, loading, ready, error } = useLibrary();
  const signedIn = isAuthed && !isPending;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <PageHeader
        kicker="Your library"
        title="Favorites"
        description="Every movie you’ve hearted, in one place. Tap the heart again to remove one."
        action={
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {favoriteMovies.length} saved
          </span>
        }
      />

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/45 bg-destructive/10 px-4 py-3 text-destructive-foreground">
          {error}
        </p>
      )}

      {!signedIn && !isPending ? (
        <SignInPrompt
          title="Save the movies you love"
          description="Log in to build your favorites list and have it ready on every device."
        />
      ) : loading && !ready ? (
        <FavoritesSkeleton />
      ) : favoriteMovies.length === 0 ? (
        <EmptyState icon={<LuHeart className="size-5" />} hint="Browse the home page and tap the heart on any movie.">
          No favorites yet.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-5">
          {favoriteMovies.map((movie) => {
            const card = libraryMovieToCard(movie);
            return (
              <MovieCard
                key={movie.tmdbId}
                movie={card}
                showActions
                isFavorite={isFavorite(card)}
                onToggleFavorite={toggleFavorite}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
