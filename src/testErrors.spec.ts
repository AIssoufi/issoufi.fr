import { describeLoggedErrors } from './testErrors.ts';

/** First line of the failure message of a test that logged errors, for one error. */
const ONE_ERROR_HEADER =
  "The test logged 1 error(s) with console.error: fix them, or silence the expected ones with vi.spyOn(console, 'error').mockImplementation(() => {}).";

describe('describeLoggedErrors', () => {
  it('returns an empty message when the test logged no error', () => {
    expect(describeLoggedErrors([])).toBe('');
  });

  it('says what to do, then gives the first line of the error, formatted as console.error does', () => {
    const actWarning = [
      'An update to %s inside a test was not wrapped in act(...).\n\nWhen testing…',
      'BurgerMenu',
    ];

    expect(describeLoggedErrors([actWarning])).toBe(
      `${ONE_ERROR_HEADER}\nAn update to BurgerMenu inside a test was not wrapped in act(...).`,
    );
  });

  it('counts the errors and gives one line for each, in the order they were logged', () => {
    const message = describeLoggedErrors([['First'], [new Error('Second')]]);

    expect(message.split('\n')).toEqual([
      expect.stringContaining('The test logged 2 error(s)'),
      'First',
      'Error: Second',
    ]);
  });

  it.each([
    ['no argument', [], ''],
    ['undefined', [undefined], 'undefined'],
    ['null', [null], 'null'],
    ['a number', [42], '42'],
    ['an object', [{ code: 403 }], '{ code: 403 }'],
    ['an empty text', [''], ''],
  ])('summarizes an error logged with %s', (_label, data, summary) => {
    expect(describeLoggedErrors([data])).toBe(`${ONE_ERROR_HEADER}\n${summary}`);
  });
});
