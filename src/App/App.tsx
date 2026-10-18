import { lazy, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router';
import { ThemeProvider } from '@xstyled/styled-components';

import { LANGUAGES, ROOT_PATH } from '../i18n/constants';
import { localizePath } from '../i18n/utils';
import { Home } from '../pages/Home';
import { GlobalStyle, theme } from '../theme';
import DocumentMeta from './DocumentMeta';
import Header from './Header';
import { useReloadOnStaleChunk } from './hooks/useReloadOnStaleChunk';
import PageHeadingFocus from './PageHeadingFocus';
import RouteErrorBoundary from './RouteErrorBoundary';
import UrlLanguage from './UrlLanguage';
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
 * the document metadata and the routes. Each page exists in every language, at its path in the
 * default language (`/projects`) and behind the prefix of each other language (`/en/projects`);
 * the texts follow the language of the URL (see {@link UrlLanguage}). Every page but the home page
 * is loaded on its first visit; the header stays on screen meanwhile. Unknown paths render
 * {@link NotFound} at the requested URL, in the language of its prefix, without redirecting.
 * Reloads the page once when a page was deployed again since it was opened (see
 * {@link useReloadOnStaleChunk}). A page that fails to render or to load shows an error with a
 * reload button below the header, which stays usable (see {@link RouteErrorBoundary}). After a
 * navigation by link, the heading of the new page takes the keyboard focus, unless only the
 * language changed (see {@link PageHeadingFocus}).
 */
function App() {
  useReloadOnStaleChunk();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <UrlLanguage />
        <DocumentMeta />
        <WebApp data-testid="app">
          <Header />
          <RouteErrorBoundary>
            <Suspense fallback={null}>
              <Routes>
                {LANGUAGES.map(language => (
                  <Route
                    key={language}
                    path={localizePath({ path: ROOT_PATH, language })}
                  >
                    <Route
                      index
                      element={<Home />}
                    />
                    <Route
                      path="projects"
                      element={<Projects />}
                    />
                    <Route
                      path="experiences"
                      element={<Experiences />}
                    />
                    <Route
                      path="*"
                      element={<NotFound />}
                    />
                  </Route>
                ))}
              </Routes>
              <PageHeadingFocus />
            </Suspense>
          </RouteErrorBoundary>
        </WebApp>
      </Router>
    </ThemeProvider>
  );
}

export default App;
