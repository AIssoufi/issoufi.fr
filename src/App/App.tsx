import { lazy, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router';
import { ThemeProvider } from '@xstyled/styled-components';

import { Home } from '../pages/Home';
import { GlobalStyle, theme } from '../theme';
import DocumentMeta from './DocumentMeta';
import Header from './Header';
import { useReloadOnStaleChunk } from './hooks/useReloadOnStaleChunk';
import RouteErrorBoundary from './RouteErrorBoundary';
import { keepPendingWhileReloading } from './utils';

import { WebApp } from './App.styled';

// The other pages are loaded on their first visit, each from its own chunk, so the home page
// only downloads its own code. Import them from their folder, never through a shared barrel,
// which would put them back in the main bundle. A page stays loading while the page reloads for a
// missing chunk.
const Projects = lazy(() => import('../pages/Projects').then(keepPendingWhileReloading));
const Experiences = lazy(() => import('../pages/Experiences').then(keepPendingWhileReloading));
const NotFound = lazy(() => import('../pages/NotFound').then(keepPendingWhileReloading));

/**
 * Root of the application: the design-token theme and global styles, the router, the header,
 * the document metadata and the routes. Every page but the home page is loaded on its first
 * visit; the header stays on screen meanwhile. Unknown paths render {@link NotFound} at the
 * requested URL, without redirecting. Reloads the page once when a page was deployed again
 * since it was opened (see {@link useReloadOnStaleChunk}). A page that fails to render or to
 * load shows an error with a reload button below the header, which stays usable
 * (see {@link RouteErrorBoundary}).
 */
function App() {
  useReloadOnStaleChunk();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <DocumentMeta />
        <WebApp data-testid="app">
          <Header />
          <RouteErrorBoundary>
            <Suspense fallback={null}>
              <Routes>
                <Route
                  path="/projects"
                  element={<Projects />}
                />
                <Route
                  path="/experiences"
                  element={<Experiences />}
                />
                <Route
                  path="/"
                  element={<Home />}
                />
                <Route
                  path="*"
                  element={<NotFound />}
                />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </WebApp>
      </Router>
    </ThemeProvider>
  );
}

export default App;
