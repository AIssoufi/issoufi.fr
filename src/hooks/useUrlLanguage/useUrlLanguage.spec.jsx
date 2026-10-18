import { act, render, renderHook, screen } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';

import { useUrlLanguage } from './useUrlLanguage';

/** Renders the hook in a router opened at a path. */
const renderAt = path =>
  renderHook(() => useUrlLanguage(), {
    wrapper: ({ children }) => <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>,
  });

/** Shows the language of the current URL. */
const LanguageDisplay = () => <output>{useUrlLanguage()}</output>;

describe('useUrlLanguage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['/en', '/en/', '/en/projects', '/en/page-inconnue'])('reads English at %s', path => {
    expect(renderAt(path).result.current).toBe('en');
  });

  it.each(['/', '/projects', '/page-inconnue', '/english'])('reads French at %s', path => {
    expect(renderAt(path).result.current).toBe('fr');
  });

  it('follows the navigations', async () => {
    const router = createMemoryRouter([{ path: '*', element: <LanguageDisplay /> }], {
      initialEntries: ['/projects'],
    });
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('status')).toHaveTextContent('fr');

    await act(() => router.navigate('/en/projects'));

    expect(screen.getByRole('status')).toHaveTextContent('en');
  });

  it('throws outside a router, like every router hook', () => {
    // React logs the error it rethrows
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useUrlLanguage())).toThrow();
  });
});
