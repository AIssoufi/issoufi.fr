import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { isPublicFile } from '../testUtils';
import { BACKGROUND_IMAGE_URL } from './constants';
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

  it('fits the buttons to narrow screens instead of widening the page', () => {
    // jsdom applies no media query, so these are the mobile styles
    renderHome();
    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(2);
    links.forEach(link => {
      const style = getComputedStyle(link);
      expect(style.width).not.toBe('max-content');
      expect(style.minWidth).not.toBe('240px');
      expect(style.flexGrow).toBe('1');
      expect(style.padding).toBe('13px 20px');
      expect(style.textAlign).toBe('center');
    });
  });

  it('serves its background from public/', () => {
    expect(isPublicFile(BACKGROUND_IMAGE_URL)).toBe(true);
  });
});
