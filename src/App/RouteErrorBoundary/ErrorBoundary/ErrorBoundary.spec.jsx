import { lazy, Suspense } from 'react';
import { render, screen } from '@testing-library/react';

import ErrorBoundary from './ErrorBoundary.tsx';

const FALLBACK_TEXT = 'Une erreur est survenue';

/** Throws the given error while rendering, as a page with a bug does. */
const Broken = ({ error = new Error('Broken page') }) => {
  throw error;
};

/** The boundary around `children`, with a fallback and the given reset key. */
const boundaryAround = ({ children, resetKey } = {}) => (
  <ErrorBoundary
    resetKey={resetKey}
    fallback={<p>{FALLBACK_TEXT}</p>}
  >
    {children}
  </ErrorBoundary>
);

const renderBoundary = params => render(boundaryAround(params));

describe('ErrorBoundary', () => {
  let consoleError;

  beforeEach(() => {
    // React logs every caught error: silenced here, and checked where it matters
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Number of console errors that logged `error`. */
  const countLogsOf = error => consoleError.mock.calls.filter(call => call.includes(error)).length;

  it('renders its children, and not the fallback, when nothing throws', () => {
    renderBoundary({ children: <p>Projets personnels</p> });

    expect(screen.getByText('Projets personnels')).toBeInTheDocument();
    expect(screen.queryByText(FALLBACK_TEXT)).not.toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('renders without any props', () => {
    const { container } = render(<ErrorBoundary />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the fallback in place of all its children when one throws', () => {
    renderBoundary({
      children: (
        <>
          <p>Projets personnels</p>
          <Broken />
        </>
      ),
    });

    expect(screen.getByText(FALLBACK_TEXT)).toBeInTheDocument();
    expect(screen.queryByText('Projets personnels')).not.toBeInTheDocument();
  });

  it('renders nothing in place of a child that throws without a fallback', () => {
    const { container } = render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('logs the caught error to the console once', () => {
    const error = new Error('Broken page');

    renderBoundary({ children: <Broken error={error} /> });

    expect(countLogsOf(error)).toBe(1);
  });

  it.each([
    ['a TypeError', new TypeError("Cannot read properties of undefined (reading 'map')")],
    ['a thrown string', 'Broken page'],
    ['a thrown null', null],
  ])('catches %s', (_, error) => {
    renderBoundary({ children: <Broken error={error} /> });

    expect(screen.getByText(FALLBACK_TEXT)).toBeInTheDocument();
  });

  it('shows the fallback when a lazy child fails to load', async () => {
    const error = new TypeError('Failed to fetch dynamically imported module: /assets/Projects.js');
    const BrokenLazy = lazy(() => Promise.reject(error));

    renderBoundary({
      children: (
        <Suspense fallback={null}>
          <BrokenLazy />
        </Suspense>
      ),
    });

    expect(await screen.findByText(FALLBACK_TEXT)).toBeInTheDocument();
    expect(countLogsOf(error)).toBe(1);
  });

  describe('reset key', () => {
    /** Renders the boundary, then again with other children and another reset key. */
    const renderThenRerender = ({ children, resetKey, nextChildren, nextResetKey }) => {
      const { rerender } = renderBoundary({ children, resetKey });

      rerender(boundaryAround({ children: nextChildren, resetKey: nextResetKey }));
    };

    it('renders the children again when the key changes after an error', () => {
      renderThenRerender({
        children: <Broken />,
        resetKey: '/experiences',
        nextChildren: <p>Projets personnels</p>,
        nextResetKey: '/projects',
      });

      expect(screen.getByText('Projets personnels')).toBeInTheDocument();
      expect(screen.queryByText(FALLBACK_TEXT)).not.toBeInTheDocument();
    });

    it.each([
      ['the same path', '/experiences', '/experiences'],
      ['NaN, equal to itself', NaN, NaN],
      ['missing', undefined, undefined],
    ])('keeps the fallback when the key stays %s', (_, resetKey, nextResetKey) => {
      renderThenRerender({
        children: <Broken />,
        resetKey,
        nextChildren: <p>Projets personnels</p>,
        nextResetKey,
      });

      expect(screen.getByText(FALLBACK_TEXT)).toBeInTheDocument();
      expect(screen.queryByText('Projets personnels')).not.toBeInTheDocument();
    });

    it('shows the fallback again when the children still throw after a reset', () => {
      const error = new Error('Broken page');

      renderThenRerender({
        children: <Broken error={error} />,
        resetKey: '/experiences',
        nextChildren: <Broken error={error} />,
        nextResetKey: '/projects',
      });

      expect(screen.getByText(FALLBACK_TEXT)).toBeInTheDocument();
      expect(countLogsOf(error)).toBe(2);
    });

    it('does not retry the children when the error comes with a new key', () => {
      // As when a link leads to a broken page: the error is shown once, not reset at once
      const error = new Error('Broken page');

      renderThenRerender({
        children: <p>Accueil</p>,
        resetKey: '/',
        nextChildren: <Broken error={error} />,
        nextResetKey: '/experiences',
      });

      expect(screen.getByText(FALLBACK_TEXT)).toBeInTheDocument();
      expect(countLogsOf(error)).toBe(1);
    });

    it('keeps rendering the children when the key changes without an error', () => {
      renderThenRerender({
        children: <p>Accueil</p>,
        resetKey: '/',
        nextChildren: <p>Projets personnels</p>,
        nextResetKey: '/projects',
      });

      expect(screen.getByText('Projets personnels')).toBeInTheDocument();
      expect(consoleError).not.toHaveBeenCalled();
    });
  });
});
