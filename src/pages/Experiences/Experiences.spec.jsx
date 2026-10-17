import { render, screen } from '@testing-library/react';

import { Experiences } from './Experiences';

describe('Experiences', () => {
  it('renders the page title', () => {
    render(<Experiences />);

    expect(screen.getByRole('heading', { name: 'Expériences', level: 1 })).toBeInTheDocument();
  });

  it.each(['Sewan Groupe', 'Wibilong', 'Supralog', 'Beepeers'])('shows the %s experience', name => {
    render(<Experiences />);

    expect(screen.getAllByRole('img', { name }).length).toBeGreaterThan(0);
  });
});
