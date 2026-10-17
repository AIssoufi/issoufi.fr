import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

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

  it('spells the second line of the title right, with UX and UI as animated words', () => {
    renderHome();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      "passionné par l'UX et l'UI Design",
    );
    expect(screen.getByText('UX')).toBeInTheDocument();
    expect(screen.getByText('UI')).toBeInTheDocument();
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
});
