import { render, screen } from '@testing-library/react';
import styled, { th } from '@xstyled/styled-components';

import { withTheme } from './testUtils';

/** Box styled with tokens, whose values only the theme gives. */
const Box = styled.div`
  padding: ${th.space(16)};
  color: ${th.color('accent')};
  border-radius: ${th.radius('md')};
`;

/** Wrapper of a spec, such as a router, that leaves a mark in the page. */
const SpecWrapper = ({ children }) => <section aria-label="Spec wrapper">{children}</section>;

// `render` is the one of src/setupTests.ts, which passes withTheme to Testing Library
describe('withTheme', () => {
  it('renders every component in the theme, without a provider in the spec', () => {
    render(<Box data-testid="box" />);
    const style = getComputedStyle(screen.getByTestId('box'));

    expect(style.padding).toBe('16px');
    expect(style.color).toBe('rgb(139, 49, 104)');
    expect(style.borderRadius).toBe('12px');
  });

  it('adds the global styles of the app to the document', () => {
    render(<Box />);
    const bodyStyle = getComputedStyle(document.body);

    expect(bodyStyle.margin).toBe('0px');
    expect(bodyStyle.fontSize).toBe('18px');
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
    expect(getComputedStyle(screen.getByTestId('box')).padding).toBe('16px');
  });

  it('renders the children alone when the wrapper of the spec is undefined', () => {
    const { container } = render(<Box data-testid="box" />, { wrapper: undefined });

    expect(container.firstChild).toBe(screen.getByTestId('box'));
    expect(getComputedStyle(screen.getByTestId('box')).padding).toBe('16px');
  });

  it('renders the wrapper of the spec empty when given no children', () => {
    const ThemeWrapper = withTheme(SpecWrapper);
    render(<ThemeWrapper />);

    expect(screen.getByRole('region', { name: 'Spec wrapper' })).toBeEmptyDOMElement();
  });
});
