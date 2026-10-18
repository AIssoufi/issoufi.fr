import { useEffect } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router';

import { focusPageHeading } from './utils';

/**
 * Moves the keyboard focus to the heading of the new page after each navigation by link (see
 * {@link focusPageHeading}), so that keyboard and screen reader users start on the page they
 * chose, instead of the focus falling back to `<body>` when the link that had it disappears, as
 * in the mobile menu. Leaves the focus to the browser on the first load and on its back and
 * forward buttons, as for a page of its own. Renders nothing.
 *
 * Must be placed inside the router, after the routes and inside their `Suspense` boundary: it is
 * then shown with the new page, so it runs once that page has its heading, even when the page
 * had to load its chunk first.
 *
 * @example
 * <Suspense fallback={null}>
 *   <Routes>…</Routes>
 *   <PageHeadingFocus />
 * </Suspense>
 */
const PageHeadingFocus = () => {
  // The key changes with every navigation, even to the current path
  const { key } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const isLinkNavigation = navigationType !== NavigationType.Pop;
    if (isLinkNavigation) focusPageHeading();
  }, [key, navigationType]);

  return null;
};

export default PageHeadingFocus;
