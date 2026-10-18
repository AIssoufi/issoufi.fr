import { Component, type ReactNode } from 'react';

/** Props of {@link ErrorBoundary}. */
interface ErrorBoundaryProps {
  /** Content to protect. Nothing is rendered in its place when missing. */
  children?: ReactNode;
  /** Shown in place of the children once one of them threw. Nothing is shown when missing. */
  fallback?: ReactNode;
  /**
   * Value whose change, once an error is shown, renders the children again, e.g. the current
   * path, so that the visitor can leave a broken page. Compared with `Object.is`.
   */
  resetKey?: unknown;
}

/** State of {@link ErrorBoundary}. */
interface ErrorBoundaryState {
  /** Whether a child threw while rendering, so that the fallback is shown instead. */
  hasError: boolean;
}

/**
 * Catches the errors thrown while rendering its children, such as a bug or a lazy component
 * whose chunk failed to load, and shows `fallback` in their place, instead of letting React
 * unmount the whole app. React logs each caught error to the console (the default
 * `onCaughtError` of `createRoot`); nothing is reported anywhere else. Changing `resetKey` after
 * an error renders the children again. Like any error boundary, it does not catch the errors of
 * event handlers and asynchronous code, which do not unmount the app.
 *
 * @example
 * <ErrorBoundary resetKey={pathname} fallback={<p>Something went wrong.</p>}>
 *   <Routes>…</Routes>
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps, previousState: ErrorBoundaryState) {
    // The update that shows the error may come with a new key, e.g. a link to a broken page:
    // only a key changed while the error is on screen resets it, so that it does not throw again
    const isErrorAlreadyShown = previousState.hasError && this.state.hasError;
    const hasResetKeyChanged = !Object.is(previousProps.resetKey, this.props.resetKey);

    if (isErrorAlreadyShown && hasResetKeyChanged) this.setState({ hasError: false });
  }

  render() {
    const { children, fallback } = this.props;

    return this.state.hasError ? fallback : children;
  }
}

export default ErrorBoundary;
