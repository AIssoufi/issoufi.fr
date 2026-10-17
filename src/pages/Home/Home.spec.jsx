import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Home } from './Home';

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );

describe('Home', () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the job title and the subtitle', () => {
    renderHome();

    expect(screen.getByText('Développeur')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Je vous aide à développer vos applications web')).toBeInTheDocument();
  });

  it('links to the projects and experiences pages', () => {
    renderHome();

    expect(screen.getByRole('link', { name: 'Voir mes projets' })).toHaveAttribute(
      'href',
      '/projects',
    );
    expect(screen.getByRole('link', { name: 'Expériences professionnelles' })).toHaveAttribute(
      'href',
      '/experiences',
    );
  });
});
