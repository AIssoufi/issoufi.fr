import { lazy, Suspense } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router';

import i18n from '../../i18n';
import RouteErrorBoundary from './RouteErrorBoundary';

/** Error of a chunk that cannot be fetched, as the browser reports it. */
const CHUNK_ERROR = new TypeError(
  'Failed to fetch dynamically imported module: https://issoufi.fr/assets/Projects-abc123.js',
);

/** Throws while rendering, as a page with a bug does. */
const BrokenPage = () => {
  throw new Error('Broken page');
};

/** Page whose chunk fails to load. */
const BrokenLazyPage = lazy(() => Promise.reject(CHUNK_ERROR));

/**
 * Renders the boundary around routes at `path`, below links that stand for the header: one to a
 * working page, one to a page that throws and one to a page whose chunk fails to load.
 */
const renderAt = path =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <nav>
        <Link to="/">Accueil</Link>
        <Link to="/broken">Cassée</Link>
      </nav>
      <RouteErrorBoundary>
        <Suspense fallback={null}>
          <Routes>
            <Route
              path="/"
              element={<h1>Accueil</h1>}
            />
            <Route
              path="/broken"
              element={<BrokenPage />}
            />
            <Route
              path="/lazy"
              element={<BrokenLazyPage />}
            />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </MemoryRouter>,
  );

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    // React logs every caught error
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await act(() => i18n.changeLanguage('fr'));
  });

  it('renders without any props', () => {
    const { container } = render(
      <MemoryRouter>
        <RouteErrorBoundary />
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the page when nothing fails', () => {
    renderAt('/');

    expect(screen.getByRole('heading', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recharger la page' })).not.toBeInTheDocument();
  });

  it('shows the error with a reload button in place of a page that throws', () => {
    renderAt('/broken');

    expect(screen.getByRole('heading', { name: 'Une erreur est survenue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recharger la page' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Accueil' })).toBeInTheDocument();
  });

  it.each([
    ['throws', '/broken', 'fr', 'Une erreur est survenue', 'Recharger la page'],
    ['throws', '/broken', 'en', 'Something went wrong', 'Reload the page'],
    ['fails to load', '/lazy', 'fr', 'Une erreur est survenue', 'Recharger la page'],
    ['fails to load', '/lazy', 'en', 'Something went wrong', 'Reload the page'],
  ])('shows the error when a page %s (%s, %s)', async (_, path, language, title, reload) => {
    await act(() => i18n.changeLanguage(language));

    renderAt(path);

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: reload })).toBeInTheDocument();
  });

  it('renders the routes again after a link to another page', async () => {
    const user = userEvent.setup();
    renderAt('/broken');

    await user.click(screen.getByRole('link', { name: 'Accueil' }));

    expect(screen.getByRole('heading', { name: 'Accueil' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recharger la page' })).not.toBeInTheDocument();
  });

  it('shows the error when a link leads to a broken page', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('link', { name: 'Cassée' }));

    expect(screen.getByRole('heading', { name: 'Une erreur est survenue' })).toBeInTheDocument();
  });
});
