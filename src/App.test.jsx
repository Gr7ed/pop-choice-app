import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import { parseRecommendationResponse } from './lib/recommendationService.js';

const preferences = {
  favoriteMovie: 'Arrival because it is thoughtful',
  mood: 'Something recent',
  favoriteGenre: 'Smart science fiction',
};

describe('PopChoice', () => {
  it('rejects empty model responses with a useful error', () => {
    expect(() => parseRecommendationResponse(null)).toThrow(/empty response/i);
  });

  it('renders accessible preference fields and prevents incomplete submission', async () => {
    const user = userEvent.setup();
    const recommend = vi.fn();
    render(<App recommend={recommend} />);
    await user.click(screen.getByRole('button', { name: /find my movies/i }));
    expect(recommend).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/favorite movie/i)).toBeInvalid();
  });

  it('submits preferences and renders recommendation cards', async () => {
    const user = userEvent.setup();
    const recommend = vi.fn().mockResolvedValue([{ title: 'Arrival', releaseYear: '2016', content: 'A thoughtful, atmospheric fit.', posterUrl: null }]);
    render(<App recommend={recommend} />);
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
    render(<App recommend={recommend} />);
    for (const [label, value] of [['favorite movie', 'A'], ['new release', 'B'], ['kind of energy', 'C']]) {
      await user.type(screen.getByLabelText(new RegExp(label, 'i')), value);
    }
    await user.click(screen.getByRole('button', { name: /find my movies/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t find/i);
    expect(screen.queryByText(/secret backend/i)).not.toBeInTheDocument();
  });
});
