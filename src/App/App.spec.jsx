import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';

describe('App', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it.each(['/page-inconnue', '/skills', '/projects/inconnu', '/experiences/inconnu/2'])(
    'shows the not found page at %s without redirecting',
    async path => {
      window.history.pushState({}, '', path);
      render(<App />);

      expect(await screen.findByText('404')).toBeInTheDocument();
      expect(screen.getByText(`La page ${path} n'existe pas.`)).toBeInTheDocument();
      expect(window.location.pathname).toBe(path);
    },
  );

  it('does not render the not found page for known routes', async () => {
    window.history.pushState({}, '', '/experiences');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Expériences' })).toBeInTheDocument();
    expect(screen.queryByText('404')).not.toBeInTheDocument();
  });

  it.each([
    ['/projects', 'Projets personnels'],
    ['/experiences', 'Expériences'],
  ])('loads the page at %s on a direct visit', async (path, heading) => {
    window.history.pushState({}, '', path);
    render(<App />);

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('renders the home page at once, without waiting for a chunk', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Voir mes projets' })).toBeInTheDocument();
  });

  it('loads the other pages on navigation', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: 'Voir mes projets' }));

    expect(await screen.findByRole('heading', { name: 'Projets personnels' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/projects');
  });

  it('lets the page column shrink to the screen width', () => {
    // A plain 1fr column grows to its widest content and makes narrow screens scroll sideways
    render(<App />);

    expect(getComputedStyle(screen.getByTestId('app')).gridTemplateColumns).toBe('minmax(0, 1fr)');
  });
});
