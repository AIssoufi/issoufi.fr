import { format } from 'node:util';

import type { RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@xstyled/styled-components';
import type { ReactNode } from 'react';

import { GlobalStyle, theme } from './theme';

/** Component that a spec puts around what it renders, such as a router. */
type SpecWrapper = RenderOptions['wrapper'];

/** Props of the wrapper returned by {@link withTheme}. */
interface ThemeWrapperProps {
  /** What the spec renders. */
  children?: ReactNode;
}

/**
 * Wrapper that renders what a spec renders in the theme and the global styles of the app, around
 * the spec's own wrapper, if any. `src/setupTests.ts` passes it to every `render` of Testing
 * Library, so that the styles hold the values of the tokens, as in the app, instead of their names
 * (`border-radius: md`, `@media (min-width: screens.tablet)`). Specs never call it themselves.
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

/**
 * Failure message of a test that logged errors with `console.error`, which `src/setupTests.ts`
 * throws after the test: what to do, then the first line of each error, as `console.error`
 * formats it, which names its cause.
 *
 * @param loggedErrors - Arguments of each `console.error` call of the test.
 * @returns `''` when the test logged no error.
 *
 * @example
 * describeLoggedErrors([['An update to %s was not wrapped in act(...).\n…', 'BurgerMenu']]);
 * // 'The test logged 1 error(s) with console.error: fix them, or silence…\n'
 * //   + 'An update to BurgerMenu was not wrapped in act(...).'
 */
export const describeLoggedErrors = (loggedErrors: unknown[][]): string => {
  if (loggedErrors.length === 0) return '';

  const summaries = loggedErrors.map(data => format(...data).split('\n')[0]);
  return [
    `The test logged ${summaries.length} error(s) with console.error: fix them, or silence the ` +
      "expected ones with vi.spyOn(console, 'error').mockImplementation(() => {}).",
    ...summaries,
  ].join('\n');
};
