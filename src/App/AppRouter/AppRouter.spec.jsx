import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useLocation } from 'react-router';

import AppRouter from './AppRouter.tsx';

/** Shows the path that the routes read. */
const Pathname = () => <p>{useLocation().pathname}</p>;

describe('AppRouter', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('renders without props, nor throws', () => {
    expect(() => render(<AppRouter />)).not.toThrow();
  });

  it('follows the address of the browser without a location', () => {
    window.history.replaceState(null, '', '/en/projects');

    render(
      <AppRouter>
        <Pathname />
      </AppRouter>,
    );

    expect(screen.getByText('/en/projects')).toBeInTheDocument();
  });

  it('renders at the location that the build gives, whatever the address', () => {
    window.history.replaceState(null, '', '/');

    render(
      <AppRouter location="/en/experiences">
        <Pathname />
      </AppRouter>,
    );

    expect(screen.getByText('/en/experiences')).toBeInTheDocument();
  });

  it('renders at its location where there is no address, as in Node.js at build time', () => {
    const html = renderToString(
      <AppRouter location="/projects">
        <Pathname />
      </AppRouter>,
    );

    expect(html).toBe('<p>/projects</p>');
  });

  it.each(['', '   '])(
    'follows the address of the browser with the blank location %j',
    location => {
      window.history.replaceState(null, '', '/experiences');

      render(
        <AppRouter location={location}>
          <Pathname />
        </AppRouter>,
      );

      expect(screen.getByText('/experiences')).toBeInTheDocument();
    },
  );
});
