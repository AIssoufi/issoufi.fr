import type { ReactNode } from 'react';
import { BrowserRouter, StaticRouter } from 'react-router';

import { isNonBlankString } from '../../utils/strings.ts';

/** Props of {@link AppRouter}. */
interface AppRouterProps {
  /**
   * Path of the page to render, such as `/en/projects`, when the build prerenders it
   * (`src/prerender.tsx`): Node.js has no address bar, so the routes read this path instead.
   * Missing or blank, they follow the address of the browser.
   */
  location?: string;
  /** Routes and the components that read them. */
  children?: ReactNode;
}

/**
 * Router of the app: a static router at `location` when the build prerenders a page, which never
 * moves, and the router of the browser history otherwise, which follows the links and the back
 * button. Both render nothing of their own, so the page that the build writes and the page that the
 * browser hydrates hold the same elements.
 *
 * @example
 * <AppRouter location="/en/projects">
 *   <Routes>…</Routes>
 * </AppRouter>
 */
const AppRouter = ({ location, children }: AppRouterProps) =>
  isNonBlankString(location) ? (
    <StaticRouter location={location}>{children}</StaticRouter>
  ) : (
    <BrowserRouter>{children}</BrowserRouter>
  );

export default AppRouter;
