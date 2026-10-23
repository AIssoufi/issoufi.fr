import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { ThemeProvider } from '@xstyled/styled-components';

import { LANGUAGES, ROOT_PATH } from '../i18n/constants.ts';
import { localizePath } from '../i18n/utils.ts';
import { Home } from '../pages/Home/index.ts';
import { GlobalStyle, theme } from '../theme/index.ts';
import AppRouter from './AppRouter/index.ts';
import DocumentMeta from './DocumentMeta/index.ts';
import Header from './Header/index.ts';
import { useReloadOnStaleChunk } from './hooks/useReloadOnStaleChunk/index.ts';
import PageHeadingFocus from './PageHeadingFocus/index.ts';
import RouteErrorBoundary from './RouteErrorBoundary/index.ts';
import SkipLink from './SkipLink/index.ts';
import UrlLanguage from './UrlLanguage/index.ts';
import { keepPendingWhileReloading } from './utils.ts';

import { WebApp } from './App.styled.ts';

// The other pages are loaded on their first visit, each from its own chunk, so the home page
// only downloads its own code. Import them from their folder, never through a shared barrel,
// which would put them back in the main bundle. A page stays loading while the page reloads for a
// missing chunk.
const Projects = lazy(() => import('../pages/Projects/index.ts').then(keepPendingWhileReloading));
const Experiences = lazy(() =>
  import('../pages/Experiences/index.ts').then(keepPendingWhileReloading),
);
const NotFound = lazy(() => import('../pages/NotFound/index.ts').then(keepPendingWhileReloading));

/**
 * Root of the application: the design-token theme and global styles, the router, the header,
 * the document metadata, the skip link to the content (see {@link SkipLink}) and the routes. Each
 * page exists in every language, at its path in the default language (`/projects`) and behind the
 * prefix of each other language (`/en/projects`); the texts follow the language of the URL (see
 * {@link UrlLanguage}). Every page but the home page
 * is loaded on its first visit; the header stays on screen meanwhile. Unknown paths render
 * {@link NotFound} at the requested URL, in the language of its prefix, without redirecting. The
 * routes match with case, as Cloudflare Pages serves the files: `/Projects` is not found either.
 * Reloads the page once when a page was deployed again since it was opened (see
 * {@link useReloadOnStaleChunk}). A page that fails to render or to load shows an error with a
 * reload button below the header, which stays usable (see {@link RouteErrorBoundary}). After a
 * navigation by link, the heading of the new page takes the keyboard focus, unless only the
 * language changed (see {@link PageHeadingFocus}). The build renders it at the path of each page,
 * which the browser then hydrates (see {@link AppRouter}).
 */
function App({ location }: AppProps) {
  useReloadOnStaleChunk();

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppRouter location={location}>
        <UrlLanguage />
        <DocumentMeta />
        <SkipLink />
        <WebApp data-testid="app">
          <Header />
          <RouteErrorBoundary>
            <Suspense fallback={null}>
              <Routes>
                {LANGUAGES.map(language => (
                  <Route
                    key={language}
                    path={localizePath({ path: ROOT_PATH, language })}
                    caseSensitive
                  >
                    <Route
                      index
                      element={<Home />}
                    />
                    <Route
                      path="projects"
                      element={<Projects />}
                      caseSensitive
                    />
                    <Route
                      path="experiences"
                      element={<Experiences />}
                      caseSensitive
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
      </AppRouter>
    </ThemeProvider>
  );
}

export default App;

/** Props of {@link App}. */
interface AppProps {
  /**
   * Path of the page to render, such as `/en/projects`, when the build prerenders it
   * (`src/prerender.tsx`). Missing, the routes follow the address of the browser.
   */
  location?: string;
}
