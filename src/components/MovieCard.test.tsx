import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import MovieCard from './MovieCard';

const LONG_DESCRIPTION = 'A lone linguist is recruited to decipher an alien language before global tensions spiral, and the deeper she listens the more the shape of time itself seems to bend around her.';

describe('MovieCard description', () => {
  it('clamps a long description behind a Show more toggle', async () => {
    const user = userEvent.setup();
    render(<MovieCard movie={{ title: 'Arrival', releaseYear: 2016, overview: LONG_DESCRIPTION }} />);

    const content = screen.getByText(LONG_DESCRIPTION);
    const toggle = screen.getByRole('button', { name: /show more/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', content.id);
    expect(content).not.toHaveClass('is-expanded');

    await user.click(toggle);

    const collapse = screen.getByRole('button', { name: /show less/i });
    expect(collapse).toHaveAttribute('aria-expanded', 'true');
    expect(content).toHaveClass('is-expanded');
  });

  it('omits the toggle for short descriptions', () => {
    render(<MovieCard movie={{ title: 'Short', releaseYear: null, overview: 'A brisk logline.' }} />);
    expect(screen.getByText('A brisk logline.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show more/i })).not.toBeInTheDocument();
  });
});
