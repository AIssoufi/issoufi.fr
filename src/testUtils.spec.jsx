import { render, screen } from '@testing-library/react';
import styled, { th } from '@xstyled/styled-components';

import { theme } from './theme';
import { describeLoggedErrors, withTheme } from './testUtils';

/** Computed color of the `accent` token (#8b3168), which only the theme gives. */
const ACCENT_COLOR = 'rgb(139, 49, 104)';
/** Computed color of the `background` token of the body (black), which only the theme gives. */
const BACKGROUND_COLOR = 'rgb(0, 0, 0)';
/** First line of the failure message of a test that logged errors, for one error. */
const ONE_ERROR_HEADER =
  "The test logged 1 error(s) with console.error: fix them, or silence the expected ones with vi.spyOn(console, 'error').mockImplementation(() => {}).";

/**
 * Box styled with tokens that only the theme resolves: without it, `th` writes their names
 * (`color: accent`), whereas a spacing such as `th.space(16)` falls back to `16px` anyway.
 */
const Box = styled.div`
  color: ${th.color('accent')};
  border-radius: ${th.radius('md')};
`;

/** Wrapper of a spec, such as a router, that leaves a mark in the page. */
const SpecWrapper = ({ children }) => <section aria-label="Spec wrapper">{children}</section>;

/** Whether the box holds the values of the theme's tokens. */
const expectThemedBox = () => {
  const style = getComputedStyle(screen.getByTestId('box'));
  expect(style.color).toBe(ACCENT_COLOR);
  expect(style.borderRadius).toBe(theme.radii.md);
};

// `render` is the one of src/setupTests.ts, which passes withTheme to Testing Library
describe('withTheme', () => {
  it('renders every component in the theme, without a provider in the spec', () => {
    render(<Box data-testid="box" />);

    expectThemedBox();
  });

  it('adds the global styles of the app to the document', () => {
    render(<Box />);
    const bodyStyle = getComputedStyle(document.body);

    expect(bodyStyle.margin).toBe('0px');
    expect(bodyStyle.backgroundColor).toBe(BACKGROUND_COLOR);
  });

  it('adds no element around what the spec renders', () => {
    const { container } = render(<Box data-testid="box" />);

    expect(container.firstChild).toBe(screen.getByTestId('box'));
    expect(container.childElementCount).toBe(1);
  });

  it('renders nothing of its own around empty content', () => {
    const { container } = render(null);

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the wrapper of the spec, inside the theme', () => {
    const { container } = render(<Box data-testid="box" />, { wrapper: SpecWrapper });
    const specWrapper = screen.getByRole('region', { name: 'Spec wrapper' });

    expect(container.firstChild).toBe(specWrapper);
    expect(specWrapper).toContainElement(screen.getByTestId('box'));
    expectThemedBox();
  });

  it('renders the children alone, in the theme, when the wrapper of the spec is undefined', () => {
    const { container } = render(<Box data-testid="box" />, { wrapper: undefined });

    expect(container.firstChild).toBe(screen.getByTestId('box'));
    expectThemedBox();
  });

  it('renders the wrapper of the spec empty when given no children', () => {
    const ThemeWrapper = withTheme(SpecWrapper);
    render(<ThemeWrapper />);

    expect(screen.getByRole('region', { name: 'Spec wrapper' })).toBeEmptyDOMElement();
  });
});

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
