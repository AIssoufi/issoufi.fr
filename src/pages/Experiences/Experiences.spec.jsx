import { render, screen } from '@testing-library/react';

import { isPublicFile } from '../testUtils';
import { BACKGROUND_IMAGE_URL } from './constants';
import { Experiences } from './Experiences';

describe('Experiences', () => {
  it('renders the page title', () => {
    render(<Experiences />);

    expect(screen.getByRole('heading', { name: 'Expériences', level: 1 })).toBeInTheDocument();
  });

  it('has a single main landmark and a single level 1 heading', () => {
    render(<Experiences />);

    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it.each(['Sewan Groupe', 'Wibilong', 'Supralog', 'Beepeers'])('shows the %s experience', name => {
    render(<Experiences />);

    expect(screen.getAllByRole('img', { name }).length).toBeGreaterThan(0);
  });

  it('serves its background from public/', () => {
    expect(isPublicFile(BACKGROUND_IMAGE_URL)).toBe(true);
  });
});
