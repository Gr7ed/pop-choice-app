import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DiscoverPage from './discover-page';
import { discoverMovies, getNowPlaying } from '../lib/api-client';
import { defaultMovieFilters } from '../lib/movie-filters';
import type { MoviePage } from '../lib/types';

vi.mock('../lib/api-client', () => ({
  discoverMovies: vi.fn(),
  getNowPlaying: vi.fn(),
}));

vi.mock('../lib/useSession', () => ({
  useSession: () => ({ user: null, isAuthed: false, isPending: false }),
}));

vi.mock('../lib/library-context', () => ({
  useLibrary: () => ({
    favoriteIds: [],
    isFavorite: () => false,
    toggleFavorite: vi.fn(),
    lists: [],
    setLists: vi.fn(),
  }),
}));

const firstPage: MoviePage = {
  page: 1,
  totalPages: 3,
  totalResults: 60,
  results: [
    {
      tmdbId: 438631,
      title: 'Dune',
      releaseYear: 2021,
      posterUrl: null,
      voteAverage: 8.1,
      overview: 'A desert planet and its spice.',
    },
  ],
};

const renderPage = (initialEntries: string[] = ['/discover']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <DiscoverPage />
      <LocationSearch />
    </MemoryRouter>,
  );

/** Renders the current router search so tests can assert what a shared link contains. */
function LocationSearch(): ReactElement {
  const { search } = useLocation();
  return <span data-testid="location-search">{search}</span>;
}

const currentParams = (): URLSearchParams =>
  new URLSearchParams(screen.getByTestId('location-search').textContent ?? '');

describe('DiscoverPage', () => {
  beforeEach(() => {
    vi.mocked(discoverMovies).mockReset().mockResolvedValue(firstPage);
    vi.mocked(getNowPlaying).mockReset().mockResolvedValue({ ...firstPage, page: 1 });
  });

  it('loads the first page of discover results with the default sort', async () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: /discover movies/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument();
    expect(discoverMovies).toHaveBeenCalledWith(defaultMovieFilters, 1);
    expect(screen.getByText(/60 movies/i)).toBeInTheDocument();
  });

  it('applies a genre filter and restarts from page one', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: 'Dune' });

    await user.click(screen.getByLabelText('Genre'));
    await user.click(await screen.findByRole('option', { name: 'Science Fiction' }));

    await waitFor(() =>
      expect(discoverMovies).toHaveBeenLastCalledWith({ ...defaultMovieFilters, genre: '878' }, 1),
    );
    expect(currentParams().get('with_genres')).toBe('878');
    expect(currentParams().get('page')).toBeNull();
  }, 15_000);

  it('shows how many filters are active and resets them', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: 'Dune' });

    await user.click(screen.getByLabelText('Genre'));
    await user.click(await screen.findByRole('option', { name: 'Science Fiction' }));

    expect(await screen.findByText('1 active')).toBeInTheDocument();

    const reset = screen.getByRole('button', { name: /reset/i });
    await waitFor(() => expect(reset).toBeEnabled());
    await user.click(reset);

    await waitFor(() => expect(discoverMovies).toHaveBeenLastCalledWith(defaultMovieFilters, 1));
    expect(screen.queryByText('1 active')).not.toBeInTheDocument();
    expect(currentParams().toString()).toBe('');
  }, 15_000);

  it('pages forward and back through results', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: 'Dune' });

    await user.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(discoverMovies).toHaveBeenLastCalledWith(defaultMovieFilters, 2));
    expect(currentParams().get('page')).toBe('2');

    const previous = screen.getByRole('button', { name: /previous/i });
    await waitFor(() => expect(previous).toBeEnabled());
    await user.click(previous);
    await waitFor(() => expect(discoverMovies).toHaveBeenLastCalledWith(defaultMovieFilters, 1));
    expect(currentParams().get('page')).toBeNull();
  });

  it('restores filters and page from a shared URL', async () => {
    renderPage([
      '/discover?sort_by=vote_average.desc&with_genres=878&primary_release_year=2021&vote_average.gte=7&with_original_language=en&page=2',
    ]);
    await screen.findByRole('heading', { name: 'Dune' });

    expect(discoverMovies).toHaveBeenCalledWith(
      {
        sortBy: 'vote_average.desc',
        genre: '878',
        year: '2021',
        minRating: '7',
        language: 'en',
      },
      2,
    );
  });

  it('ignores unknown values in a shared URL', async () => {
    renderPage(['/discover?sort_by=not-a-sort&with_genres=not-a-genre&vote_average.gte=99&page=abc']);
    await screen.findByRole('heading', { name: 'Dune' });

    expect(discoverMovies).toHaveBeenCalledWith(defaultMovieFilters, 1);
  });

  it('switches to the now playing feed', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: 'Dune' });

    await user.click(screen.getByRole('button', { name: /now playing/i }));

    await waitFor(() => expect(getNowPlaying).toHaveBeenCalledWith(1));
    expect(currentParams().get('tab')).toBe('nowPlaying');
    expect(await screen.findByRole('heading', { name: 'Dune' })).toBeInTheDocument();
  });

  it('reports a safe error when the feed is unavailable', async () => {
    vi.mocked(discoverMovies).mockRejectedValue(new Error('secret upstream detail'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t load these movies/i);
    expect(screen.queryByText(/secret upstream detail/i)).not.toBeInTheDocument();
  });
});
