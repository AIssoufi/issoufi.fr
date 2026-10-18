import type { RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@xstyled/styled-components';
import type { ReactNode } from 'react';

import { GlobalStyle, theme } from './theme';

/** Component that a spec puts around what it renders, such as a router. */
type Wrapper = RenderOptions['wrapper'];

/** Props of the wrapper returned by {@link withTheme}. */
interface ThemeWrapperProps {
  /** What the spec renders. */
  children?: ReactNode;
}

/**
 * Wrapper that renders what a spec renders in the theme and the global styles of the app, around
 * the spec's own wrapper, if any. `src/setupTests.ts` passes it to every `render` of Testing
 * Library, so that the styles hold the values of the tokens, as in the app, instead of their names
 * (`padding-left: page`, `@media (min-width: screens.tablet)`).
 *
 * @param Wrapper - Wrapper the spec passed to `render`, such as a router; it goes inside the theme.
 * Without it, the children sit right in the theme.
 * @returns A component for the `wrapper` option of `render`.
 *
 * @example
 * render(<Home />, { wrapper: withTheme(MemoryRouter) });
 */
export const withTheme = (Wrapper?: Wrapper) => {
  /** Theme and global styles of the app around the children, in the spec's wrapper if any. */
  const ThemeWrapper = ({ children }: ThemeWrapperProps) => (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {Wrapper ? <Wrapper>{children}</Wrapper> : children}
    </ThemeProvider>
  );
  return ThemeWrapper;
};
