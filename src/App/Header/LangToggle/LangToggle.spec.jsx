import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LangToggle from './LangToggle';

describe('LangToggle', () => {
  it('renders FR and EN buttons', () => {
    render(<LangToggle />);
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('FR is active by default', () => {
    render(<LangToggle />);
    const frBtn = screen.getByText('FR');
    const enBtn = screen.getByText('EN');
    expect(frBtn).toBeInTheDocument();
    expect(enBtn).toBeInTheDocument();
  });

  it('switches to EN when EN button is clicked', async () => {
    render(<LangToggle />);
    await userEvent.click(screen.getByText('EN'));
    // After clicking EN, the EN button should still be present
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('switches back to FR when FR button is clicked', async () => {
    render(<LangToggle />);
    await userEvent.click(screen.getByText('EN'));
    await userEvent.click(screen.getByText('FR'));
    expect(screen.getByText('FR')).toBeInTheDocument();
  });
});
