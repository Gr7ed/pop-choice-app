import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { LuListVideo, LuPlus, LuTrash2 } from 'react-icons/lu';
import MovieCard from '../components/MovieCard';
import EmptyState from '../components/EmptyState';
import SignInPrompt from '../components/SignInPrompt';
import PageHeader from '../components/layout/page-header';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useLibrary } from '../lib/library-context';
import { libraryMovieToCard } from '../lib/movie-adapters';
import { useSession } from '../lib/useSession';
import type { MovieCardData } from '../lib/types';

export default function MyListsPage(): ReactElement {
  const { isAuthed, isPending } = useSession();
  const { lists, loading, ready, error, createList, deleteList, removeMovieFromList } = useLibrary();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const signedIn = isAuthed && !isPending;

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setCreateError('');
    try {
      await createList(trimmed);
      setName('');
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'Could not create this list.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <PageHeader
        kicker="Your library"
        title="My Lists"
        description="Group movies into watchlists for a night in, a marathon, or a rainy Sunday."
        action={
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {lists.length} {lists.length === 1 ? 'list' : 'lists'}
          </span>
        }
      />

      {(error || createError) && (
        <p role="alert" className="rounded-lg border border-destructive/45 bg-destructive/10 px-4 py-3 text-destructive-foreground">
          {createError || error}
        </p>
      )}

      {!signedIn && !isPending ? (
        <SignInPrompt
          title="Build your own lists"
          description="Log in to create watchlists and keep your movie nights organised."
        />
      ) : (
        <>
          <Card className="gap-4 p-4 sm:p-5">
            <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleCreate}>
              <div className="grid flex-1 gap-2">
                <Label htmlFor="list-name">New list name</Label>
                <Input
                  id="list-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Weekend watchlist"
                  maxLength={80}
                  className="h-10 rounded-xl"
                />
              </div>
              <Button type="submit" disabled={creating || !name.trim()} className="h-10 rounded-xl px-5">
                {creating ? (
                  'Creating…'
                ) : (
                  <>
                    <LuPlus aria-hidden="true" /> Create list
                  </>
                )}
              </Button>
            </form>
          </Card>

          {loading && !ready ? (
            <p className="text-muted-foreground">Loading your lists…</p>
          ) : lists.length === 0 ? (
            <EmptyState icon={<LuListVideo className="size-5" />} hint="Name a list above to get started.">
              You don’t have any lists yet.
            </EmptyState>
          ) : (
            <div className="grid gap-6">
              {lists.map((list) => (
                <Card key={list.id} className="gap-5 p-4 sm:p-5">
                  <CardHeader className="flex flex-row items-center justify-between gap-3 px-0">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <LuListVideo className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <CardTitle className="font-heading text-lg">{list.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {list.items.length} movie{list.items.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete list ${list.name}`}
                      onClick={() => deleteList(list.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <LuTrash2 aria-hidden="true" />
                    </Button>
                  </CardHeader>

                  <CardContent className="px-0">
                    {list.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nothing here yet — add movies from the home page.
                      </p>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-5">
                        {list.items.map((item) => (
                          <MovieCard
                            key={item.tmdbId}
                            movie={libraryMovieToCard(item)}
                            headingLevel={4}
                            showActions
                            onRemove={(movie: MovieCardData) => {
                              if (typeof movie.tmdbId === 'number') removeMovieFromList(list.id, movie.tmdbId);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
