import type { RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@xstyled/styled-components';
import type { ReactNode } from 'react';

import { GlobalStyle, theme } from './theme/index.ts';

/** Component that a spec puts around what it renders, such as a router. */
type SpecWrapper = RenderOptions['wrapper'];

/** Props of the wrapper returned by {@link withTheme}. */
interface ThemeWrapperProps {
  /** What the spec renders. */
  children?: ReactNode;
}

/**
 * Builds a wrapper that renders what a spec renders in the theme and the global styles of the app,
 * around the spec's own wrapper, if any. `src/setupTests.ts` passes it to every `render` of
 * Testing Library, so that the styles hold the values of the tokens, as in the app, instead of
 * their names (`border-radius: md`, `@media (min-width: screens.tablet)`). Specs never call it
 * themselves.
 *
 * @param Wrapper - Wrapper the spec passed to `render`, such as a router; it goes inside the theme.
 * Without it, the children sit right in the theme.
 * @returns A component for the `wrapper` option of `render`.
 *
 * @example
 * // In src/setupTests.ts, `render(<Home />, { wrapper: MemoryRouter })` of a spec becomes:
 * testingLibrary.render(<Home />, { wrapper: withTheme(MemoryRouter) });
 */
export const withTheme = (Wrapper?: SpecWrapper) => {
  /** Theme and global styles of the app around the children, in the spec's wrapper if any. */
  const ThemeWrapper = ({ children }: ThemeWrapperProps) => (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {Wrapper ? <Wrapper>{children}</Wrapper> : children}
    </ThemeProvider>
  );
  return ThemeWrapper;
};
