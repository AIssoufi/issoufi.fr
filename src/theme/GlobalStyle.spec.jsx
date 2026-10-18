import { render, screen } from '@testing-library/react';
import styled, { ThemeProvider } from '@xstyled/styled-components';

import { listStyleRules } from '../pages/testUtils';
import { GlobalStyle } from './GlobalStyle';
import { theme } from './theme';

const ContentBox = styled.div`
  box-sizing: content-box;
`;

/** Renders the global styles, with the given elements, in the theme of the app. */
const renderWithGlobalStyle = children =>
  render(
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>,
  );

/** Style rules of the document, outside any media query, whose selector lists all the given ones. */
const findRulesSelecting = selectors =>
  listStyleRules()
    .filter(({ media }) => media === '')
    .map(({ rule }) => rule)
    .filter(rule => {
      const ruleSelectors = rule.selectorText?.split(',').map(selector => selector.trim()) ?? [];
      return selectors.every(selector => ruleSelectors.includes(selector));
    });

describe('GlobalStyle', () => {
  it('renders without crashing', () => {
    expect(() => renderWithGlobalStyle()).not.toThrow();
  });

  it('sizes every element, however deep and whatever its tag, with border-box', () => {
    renderWithGlobalStyle(
      <section>
        <div data-testid="box">
          <img
            data-testid="image"
            alt=""
          />
          <button
            data-testid="button"
            type="button"
          />
          <input data-testid="input" />
        </div>
      </section>,
    );

    for (const testId of ['box', 'image', 'button', 'input']) {
      expect(getComputedStyle(screen.getByTestId(testId)).boxSizing).toBe('border-box');
    }
  });

  it('sizes the ::before and ::after pseudo-elements with border-box', () => {
    renderWithGlobalStyle();

    const rules = findRulesSelecting(['*', '*::before', '*::after']);
    expect(rules).toHaveLength(1);
    expect(rules[0].style.getPropertyValue('box-sizing')).toBe('border-box');
  });

  it('lets a component that sets its own box sizing keep it', () => {
    renderWithGlobalStyle(<ContentBox data-testid="content-box" />);

    expect(getComputedStyle(screen.getByTestId('content-box')).boxSizing).toBe('content-box');
  });
});
