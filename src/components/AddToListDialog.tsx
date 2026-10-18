import { useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { addToList, createList, getLists } from '../lib/api-client';
import type { ListSummary, MovieCardData } from '../lib/types';

interface AddToListDialogProps {
  movie: MovieCardData;
  lists: ListSummary[];
  onClose: () => void;
  onListsChanged: (lists: ListSummary[]) => void;
  onError: (message: string) => void;
}

export default function AddToListDialog({ movie, lists, onClose, onListsChanged, onError }: AddToListDialogProps): ReactElement {
  const [newListName, setNewListName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    onListsChanged(await getLists());
  };

  const submitNewList = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newListName.trim()) return;
    setIsLoading(true);
    try {
      const list = await createList(newListName.trim());
      onListsChanged([...lists, list]);
      setNewListName('');
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not create this list.');
    } finally {
      setIsLoading(false);
    }
  };

  const addTo = async (list: ListSummary) => {
    setIsLoading(true);
    try {
      await addToList(list.id, movie);
      await refresh();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not add this movie to the list.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-heading" onClick={(event) => event.stopPropagation()}>
        <div className="form-heading">
          <p className="section-kicker">Your lists</p>
          <h2 id="dialog-heading">Add “{movie.title}”</h2>
        </div>
        {lists.length === 0 ? (
          <p className="dialog-hint">You have no lists yet — create your first one below.</p>
        ) : (
          <ul className="dialog-lists">
            {lists.map((list) => (
              <li key={list.id}>
                <button type="button" disabled={isLoading} onClick={() => addTo(list)}>
                  <span>{list.name}</span>
                  <small>{list.items.length} movie{list.items.length === 1 ? '' : 's'}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="dialog-form" onSubmit={submitNewList}>
          <label className="field">
            <span>New list name</span>
            <input
              type="text"
              value={newListName}
              onChange={(event) => setNewListName(event.target.value)}
              placeholder="Weekend watchlist"
              maxLength={80}
            />
          </label>
          <div className="dialog-actions">
            <button type="button" className="card-action" onClick={onClose}>Close</button>
            <button className="submit-btn" type="submit" disabled={isLoading || !newListName.trim()}>
              {isLoading ? <><span className="spinner" aria-hidden="true" /> Working…</> : 'Create list'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
