import type { ReactNode } from 'react';
import { useLocation } from 'react-router';

import ErrorBoundary from './ErrorBoundary';
import UnexpectedError from './UnexpectedError';

/** Props of {@link RouteErrorBoundary}. */
interface RouteErrorBoundaryProps {
  /** Routes to protect. Nothing is rendered in their place when missing. */
  children?: ReactNode;
}

/**
 * Shows {@link UnexpectedError} in place of the routes when a page throws while rendering or
 * when its chunk fails to load, so that the rest of the app, such as the header, stays usable.
 * Going to another path renders the routes again. Must be rendered inside a router.
 *
 * @example
 * <RouteErrorBoundary>
 *   <Routes>…</Routes>
 * </RouteErrorBoundary>
 */
const RouteErrorBoundary = ({ children }: RouteErrorBoundaryProps) => {
  const { pathname } = useLocation();

  return (
    <ErrorBoundary
      resetKey={pathname}
      fallback={<UnexpectedError />}
    >
      {children}
    </ErrorBoundary>
  );
};

export default RouteErrorBoundary;
