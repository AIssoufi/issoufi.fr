import { format } from 'node:util';

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
