import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AddToListDialog from './AddToListDialog';
import { createList } from '../lib/api-client';
import type { ListSummary, MovieCardData } from '../lib/types';

vi.mock('../lib/api-client', () => ({
  addToList: vi.fn(),
  createList: vi.fn(),
  getLists: vi.fn(),
}));

const movie: MovieCardData = { title: 'Arrival', releaseYear: 2016, tmdbId: 329865 };

function renderDialog(lists: ListSummary[] = []) {
  const onClose = vi.fn();
  render(
    <AddToListDialog
      movie={movie}
      lists={lists}
      onClose={onClose}
      onListsChanged={vi.fn()}
      onError={vi.fn()}
    />,
  );
  return { onClose };
}

describe('AddToListDialog accessibility', () => {
  it('exposes a labelled modal dialog and focuses it on open', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName(/Arrival/);
    expect(dialog).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps keyboard focus inside the dialog', async () => {
    const user = userEvent.setup();
    renderDialog();
    const input = screen.getByLabelText(/new list name/i);
    const close = screen.getByRole('button', { name: /^close$/i });

    await user.tab();
    expect(input).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab();
    expect(input).toHaveFocus();
    await user.tab({ shift: true });
    expect(close).toHaveFocus();
  });
});

describe('AddToListDialog list creation', () => {
  const renderCreating = (onListsChanged = vi.fn()) => {
    render(
      <AddToListDialog
        movie={movie}
        lists={[]}
        onClose={vi.fn()}
        onListsChanged={onListsChanged}
        onError={vi.fn()}
      />,
    );
    return { onListsChanged };
  };

  it('creates a list through the form action and resets the field', async () => {
    const user = userEvent.setup();
    const created: ListSummary = { id: 'list-1', name: 'Weekend watchlist', items: [] };
    vi.mocked(createList).mockResolvedValue(created);
    const { onListsChanged } = renderCreating();

    const input = screen.getByLabelText(/new list name/i);
    await user.type(input, 'Weekend watchlist');
    await user.click(screen.getByRole('button', { name: /create list/i }));

    await waitFor(() => expect(onListsChanged).toHaveBeenCalledWith([created]));
    expect(createList).toHaveBeenCalledWith('Weekend watchlist');
    expect(input).toHaveValue('');
  });

  it('shows a meaningful pending label while the list is being created', async () => {
    const user = userEvent.setup();
    let resolveCreate!: (list: ListSummary) => void;
    vi.mocked(createList).mockReturnValue(
      new Promise<ListSummary>((resolve) => {
        resolveCreate = resolve;
      }),
    );
    renderCreating();

    await user.type(screen.getByLabelText(/new list name/i), 'Sci-fi');
    await user.click(screen.getByRole('button', { name: /create list/i }));

    expect(await screen.findByRole('button', { name: /creating list/i })).toBeDisabled();

    await act(async () => {
      resolveCreate({ id: 'list-2', name: 'Sci-fi', items: [] });
    });
    expect(await screen.findByRole('button', { name: /^create list$/i })).toBeInTheDocument();
  });
});
