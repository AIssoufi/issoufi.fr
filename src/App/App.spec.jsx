import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it.each(['/page-inconnue', '/skills', '/projects/inconnu', '/experiences/inconnu/2'])(
    'shows the not found page at %s without redirecting',
    path => {
      window.history.pushState({}, '', path);
      render(<App />);

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText(`La page ${path} n'existe pas.`)).toBeInTheDocument();
      expect(window.location.pathname).toBe(path);
    },
  );

  it('does not render the not found page for known routes', () => {
    window.history.pushState({}, '', '/experiences');
    render(<App />);
    expect(screen.queryByText('404')).not.toBeInTheDocument();
  });

  it('lets the page column shrink to the screen width', () => {
    // A plain 1fr column grows to its widest content and makes narrow screens scroll sideways
    render(<App />);

    expect(getComputedStyle(screen.getByTestId('app')).gridTemplateColumns).toBe('minmax(0, 1fr)');
  });
});
