import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { parseRecommendationResponse } from './lib/recommendationService';
import type { AppProps } from './lib/types';
import type { Preferences } from './lib/types';

const preferences: Preferences = {
  favoriteMovie: 'Arrival because it is thoughtful',
  mood: 'Something recent',
  favoriteGenre: 'Smart science fiction',
};

const renderApp = (props: AppProps = {}, initialEntries: string[] = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <App {...props} />
    </MemoryRouter>,
  );

describe('PopChoice', () => {
  it('rejects empty model responses with a useful error', () => {
    expect(() => parseRecommendationResponse(null)).toThrow(/empty response/i);
  });

  it('reports malformed model JSON without leaking the parser exception', () => {
    expect(() => parseRecommendationResponse('{"recommendations":[{"title":"Arrival"}')).toThrow(/malformed JSON/i);
  });

  it('renders accessible preference fields and prevents incomplete submission', async () => {
    const user = userEvent.setup();
    const recommend = vi.fn();
    renderApp({ recommend });
    await user.click(screen.getByRole('button', { name: /find my movies/i }));
    expect(recommend).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/favorite movie/i)).toBeInvalid();
  });

  it('submits preferences and renders recommendation cards', async () => {
    const user = userEvent.setup();
    const recommend = vi.fn().mockResolvedValue([{ title: 'Arrival', releaseYear: '2016', content: 'A thoughtful, atmospheric fit.', posterUrl: null }]);
    renderApp({ recommend });
    await user.type(screen.getByLabelText(/favorite movie/i), preferences.favoriteMovie);
    await user.type(screen.getByLabelText(/new release/i), preferences.mood);
    await user.type(screen.getByLabelText(/kind of energy/i), preferences.favoriteGenre);
    await user.click(screen.getByRole('button', { name: /find my movies/i }));
    expect(await screen.findByRole('heading', { name: 'Arrival' })).toBeInTheDocument();
    expect(recommend).toHaveBeenCalledWith(preferences);
  });

  it('announces service failures without exposing raw errors', async () => {
    const user = userEvent.setup();
    const recommend = vi.fn().mockRejectedValue(new Error('secret backend detail'));
    renderApp({ recommend });
    for (const [label, value] of [['favorite movie', 'A'], ['new release', 'B'], ['kind of energy', 'C']]) {
      await user.type(screen.getByLabelText(new RegExp(label, 'i')), value);
    }
    await user.click(screen.getByRole('button', { name: /find my movies/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t find/i);
    expect(screen.queryByText(/secret backend/i)).not.toBeInTheDocument();
  });

  it('provides a skip link and a single top-level heading', () => {
    renderApp({ recommend: vi.fn() });
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main-content');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});

describe('PopChoice navigation', () => {
  it('renders home, favorites and my lists nav links', () => {
    renderApp({ recommend: vi.fn() });
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(nav).toBeInTheDocument();
    for (const name of [/home/i, /favorites/i, /my lists/i]) {
      expect(screen.getAllByRole('link', { name })[0]).toBeInTheDocument();
    }
  });

  it('marks the active route with aria-current', () => {
    renderApp({ recommend: vi.fn() }, ['/favorites']);
    const active = screen.getAllByRole('link', { name: /favorites/i }).find((link) => link.getAttribute('aria-current') === 'page');
    expect(active).toBeTruthy();
  });

  it('redirects unknown routes to the not-found page', () => {
    renderApp({ recommend: vi.fn() }, ['/nope']);
    expect(screen.getByRole('heading', { name: /doesn’t exist/i })).toBeInTheDocument();
  });

  it('renders the my lists page for signed-out visitors', () => {
    renderApp({ recommend: vi.fn() }, ['/mylists']);
    expect(screen.getByRole('heading', { level: 1, name: /my lists/i })).toBeInTheDocument();
  });

  it('opens the mobile menu with the same navigation links', async () => {
    const user = userEvent.setup();
    renderApp({ recommend: vi.fn() });
    await user.click(screen.getByRole('button', { name: /open menu/i }));
    const mobileNav = await screen.findByRole('navigation', { name: /mobile/i });
    for (const name of [/home/i, /favorites/i, /my lists/i]) {
      expect(within(mobileNav).getByRole('link', { name })).toBeInTheDocument();
    }
  });
});
