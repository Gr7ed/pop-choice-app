import { useActionState, useState } from 'react';
import type { ReactElement } from 'react';
import { LuCircleCheck, LuInfo, LuListPlus, LuPlus } from 'react-icons/lu';
import { addToList, ApiRequestError, createList, getLists } from '../lib/api-client';
import { Button } from './ui/button';
import Spinner from './ui/spinner';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import type { ListSummary, MovieCardData } from '../lib/types';

interface AddToListDialogProps {
  movie: MovieCardData;
  lists: ListSummary[];
  onClose: () => void;
  onListsChanged: (lists: ListSummary[]) => void;
  onError: (message: string) => void;
}

/**
 * Modal for saving a movie into one of the user's lists, or creating a new one
 * on the spot. Radix owns focus trapping, Escape handling, and scroll locking.
 */
export default function AddToListDialog({
  movie,
  lists,
  onClose,
  onListsChanged,
  onError,
}: AddToListDialogProps): ReactElement {
  const [newListName, setNewListName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'info'; message: string } | null>(null);

  const [, createListAction, isCreating] = useActionState(
    async (_previousState: null, formData: FormData): Promise<null> => {
      const name = String(formData.get('name') ?? '').trim();
      if (!name) return null;

      try {
        const list = await createList(name);
        onListsChanged([...lists, list]);
        setNewListName('');
        setFeedback(null);
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Could not create this list.');
      }
      return null;
    },
    null,
  );

  const addTo = async (list: ListSummary) => {
    setIsAdding(true);
    setFeedback(null);
    try {
      await addToList(list.id, movie);
      onListsChanged(await getLists());
      setFeedback({ tone: 'success', message: `Added to “${list.name}”` });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        setFeedback({ tone: 'info', message: `“${movie.title}” is already in “${list.name}”` });
      } else {
        onError(error instanceof Error ? error.message : 'Could not add this movie to the list.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const isBusy = isCreating || isAdding;

  const containsMovie = (list: ListSummary) =>
    typeof movie.tmdbId === 'number' && list.items.some((item) => item.tmdbId === movie.tmdbId);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 sm:max-w-md"
        aria-busy={isBusy || undefined}
        onOpenAutoFocus={(event) => {
          // Keep focus on the dialog itself on open so the title is announced
          // and the first Tab lands on the list-name field.
          event.preventDefault();
          (event.target as HTMLElement | null)?.focus();
        }}
      >
        <DialogHeader>
          <p className="text-kicker text-xs">Your lists</p>
          <DialogTitle className="font-heading text-xl">Add “{movie.title}”</DialogTitle>
          <DialogDescription>
            {lists.length === 0
              ? 'You have no lists yet — create your first one below.'
              : 'Pick a list to save this movie to, or start a new one.'}
          </DialogDescription>
        </DialogHeader>

        {feedback && (
          <p
            role="status"
            aria-live="polite"
            className={
              feedback.tone === 'success'
                ? 'flex items-center gap-2 rounded-lg border border-primary/45 bg-primary/10 px-3 py-2 text-sm text-foreground'
                : 'flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'
            }
          >
            {feedback.tone === 'success' ? (
              <LuCircleCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
            ) : (
              <LuInfo className="size-4 shrink-0" aria-hidden="true" />
            )}
            {feedback.message}
          </p>
        )}

        {lists.length > 0 && (
          <ul className="grid max-h-64 gap-2 overflow-y-auto">
            {lists.map((list) => {
              const alreadyAdded = containsMovie(list);
              return (
                <li key={list.id}>
                  <button
                    type="button"
                    disabled={isBusy || alreadyAdded}
                    onClick={() => addTo(list)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-left text-foreground transition-colors hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {alreadyAdded ? (
                        <LuCircleCheck className="size-4 text-primary" aria-hidden="true" />
                      ) : (
                        <LuListPlus className="size-4 text-primary" aria-hidden="true" />
                      )}
                      {list.name}
                    </span>
                    <small className="text-muted-foreground">
                      {alreadyAdded
                        ? 'Already added'
                        : `${list.items.length} movie${list.items.length === 1 ? '' : 's'}`}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <form className="grid gap-4" action={createListAction}>
          <div className="grid gap-2">
            <Label htmlFor="new-list-name">New list name</Label>
            <Input
              id="new-list-name"
              type="text"
              name="name"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="Weekend watchlist"
              maxLength={80}
              className="h-10 rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              type="submit"
              disabled={!newListName.trim() || isBusy}
              aria-busy={isCreating || undefined}
            >
              {isCreating ? (
                <>
                  <Spinner /> Creating list…
                </>
              ) : (
                <>
                  <LuPlus aria-hidden="true" /> Create list
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
