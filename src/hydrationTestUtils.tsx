import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

import { withTheme } from './testUtils.tsx';

/**
 * Renders what a spec renders as the build renders a page: to HTML, in the theme and the global
 * styles of the app, as `render` does (see {@link withTheme}). Puts that HTML in a container of the
 * document, then hydrates it with `render`, as the browser hydrates a page that the build wrote.
 * React logs with `console.error` each element, text or attribute that differs between the two
 * renders, which fails the test (`src/setupTests.ts`).
 *
 * @param ui - What to render, such as a page in a router at its path.
 * @returns What `render` returns, the container holding the hydrated page.
 *
 * @example
 * renderHydrated(<MemoryRouter initialEntries={['/skills']}><NotFound /></MemoryRouter>);
 * screen.getByText('La page /skills n’existe pas.');
 */
export const renderHydrated = (ui: ReactElement) => {
  const ThemeWrapper = withTheme();
  const container = document.body.appendChild(document.createElement('div'));
  container.innerHTML = renderToString(<ThemeWrapper>{ui}</ThemeWrapper>);
  return render(ui, { container, hydrate: true });
};
