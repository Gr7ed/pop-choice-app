import { useActionState, useEffect, useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { addToList, createList, getLists } from '../lib/api-client';
import { Button, Field } from './ui';
import type { ListSummary, MovieCardData } from '../lib/types';

interface AddToListDialogProps {
  movie: MovieCardData;
  lists: ListSummary[];
  onClose: () => void;
  onListsChanged: (lists: ListSummary[]) => void;
  onError: (message: string) => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function AddToListDialog({
  movie,
  lists,
  onClose,
  onListsChanged,
  onError,
}: AddToListDialogProps): ReactElement {
  const [newListName, setNewListName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const hintId = useId();

  // Modal behaviour: focus the dialog, trap Tab, close on Escape, lock scroll,
  // and hand focus back to the trigger when the dialog unmounts.
  useEffect(() => {
    const node = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    node?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const refresh = async () => {
    onListsChanged(await getLists());
  };

  const [, createListAction, isCreating] = useActionState(
    async (_previousState: null, formData: FormData): Promise<null> => {
      const name = String(formData.get('name') ?? '').trim();
      if (!name) return null;

      try {
        const list = await createList(name);
        onListsChanged([...lists, list]);
        setNewListName('');
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Could not create this list.');
      }
      return null;
    },
    null,
  );

  const addTo = async (list: ListSummary) => {
    setIsAdding(true);
    try {
      await addToList(list.id, movie);
      await refresh();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not add this movie to the list.');
    } finally {
      setIsAdding(false);
    }
  };

  const isBusy = isCreating || isAdding;

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={lists.length === 0 ? hintId : undefined}
        aria-busy={isBusy || undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="form-heading">
          <p className="section-kicker">Your lists</p>
          <h2 id={headingId} className="section-title section-title-sm">Add “{movie.title}”</h2>
        </div>
        {lists.length === 0 ? (
          <p className="dialog-hint" id={hintId}>You have no lists yet — create your first one below.</p>
        ) : (
          <ul className="dialog-lists">
            {lists.map((list) => (
              <li key={list.id}>
                <button type="button" disabled={isBusy} onClick={() => addTo(list)}>
                  <span>{list.name}</span>
                  <small>{list.items.length} movie{list.items.length === 1 ? '' : 's'}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="dialog-form" action={createListAction}>
          <Field label="New list name">
            <input
              type="text"
              name="name"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="Weekend watchlist"
              maxLength={80}
            />
          </Field>
          <div className="dialog-actions">
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button
              type="submit"
              size="sm"
              loading={isCreating}
              loadingLabel="Creating list…"
              disabled={!newListName.trim()}
            >
              Create list
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
