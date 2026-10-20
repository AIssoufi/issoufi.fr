import { useEffect, useRef } from 'react';
import { NavigationType, useLocation, useNavigationType } from 'react-router';

import { focusPageHeading } from '../utils.ts';
import { isLanguageSwitch } from './utils.ts';

/**
 * Moves the keyboard focus to the heading of the new page after each navigation by link (see
 * {@link focusPageHeading}), so that keyboard and screen reader users start on the page they
 * chose, instead of the focus falling back to `<body>` when the link that had it disappears, as
 * in the mobile menu. Leaves the focus to the browser on the first load and on its back and
 * forward buttons, as for a page of its own, and where it is when only the language of the page
 * changed (see {@link isLanguageSwitch}), so it stays on the language toggle. Renders nothing.
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
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    const isLinkNavigation = navigationType !== NavigationType.Pop;
    const isNewPage = !isLanguageSwitch({ from: previousPathname, to: pathname });
    if (isLinkNavigation && isNewPage) focusPageHeading();
  }, [key, navigationType, pathname]);

  return null;
};

export default PageHeadingFocus;
