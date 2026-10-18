import { render, screen } from '@testing-library/react';
import styled, { ThemeProvider } from '@xstyled/styled-components';

import { listStyleRules } from '../styleTestUtils';
import { REDUCED_MOTION_QUERY } from './constants';
import { GlobalStyle } from './GlobalStyle';
import { theme } from './theme';

/**
 * Properties that the reduced motion rule sets, with the value it gives each one: a single
 * near-zero iteration, so a loop stops, without the delays that would hide an entrance or hold a
 * step of a transition meanwhile.
 */
const REDUCED_MOTION_VALUES = {
  'animation-duration': theme.durations.instant,
  'animation-delay': '0s',
  'animation-iteration-count': '1',
  'transition-duration': theme.durations.instant,
  'transition-delay': '0s',
};

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

/**
 * Style rules of the document whose selector lists all the given `selectors`, outside any media
 * query by default, or in the media query whose condition is `media`.
 */
const findRulesSelecting = ({ selectors, media = '' }) =>
  listStyleRules()
    .filter(rule => rule.media === media)
    .map(({ rule }) => rule)
    .filter(rule => {
      const ruleSelectors = rule.selectorText?.split(',').map(selector => selector.trim()) ?? [];
      return selectors.every(selector => ruleSelectors.includes(selector));
    });

/**
 * Style rules of the document, outside any media query, that select the element and declare its
 * box sizing. jsdom 30 leaves a rule out of the computed styles when its selector list holds a
 * pseudo-element, as `*, *::before, *::after` does, so the tests read the rules themselves until
 * it is fixed (ISF-137).
 */
const findBoxSizingRulesOf = element =>
  listStyleRules()
    .filter(({ media, rule }) => media === '' && rule instanceof CSSStyleRule)
    .map(({ rule }) => rule)
    .filter(rule => {
      const declaresBoxSizing = rule.style.getPropertyValue('box-sizing') !== '';
      return declaresBoxSizing && element.matches(rule.selectorText);
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
      const boxSizings = findBoxSizingRulesOf(screen.getByTestId(testId)).map(rule =>
        rule.style.getPropertyValue('box-sizing'),
      );
      expect(boxSizings).toEqual(['border-box']);
    }
  });

  it('sizes the ::before and ::after pseudo-elements with border-box', () => {
    renderWithGlobalStyle();

    const rules = findRulesSelecting({ selectors: ['*', '*::before', '*::after'] });
    expect(rules).toHaveLength(1);
    expect(rules[0].style.getPropertyValue('box-sizing')).toBe('border-box');
  });

  it('lets a component that sets its own box sizing keep it', () => {
    renderWithGlobalStyle(<ContentBox data-testid="content-box" />);
    const [universalRule] = findRulesSelecting({ selectors: ['*'] });

    // The class of a component outweighs the universal selector, unless the latter is important
    expect(universalRule.style.getPropertyPriority('box-sizing')).toBe('');
    expect(getComputedStyle(screen.getByTestId('content-box')).boxSizing).toBe('content-box');
  });

  describe('with reduced motion', () => {
    it('makes every animation and transition instant, on the elements and pseudo-elements', () => {
      renderWithGlobalStyle();

      const rules = findRulesSelecting({
        selectors: ['*', '*::before', '*::after'],
        media: REDUCED_MOTION_QUERY,
      });
      expect(rules).toHaveLength(1);
      const [rule] = rules;
      for (const [property, value] of Object.entries(REDUCED_MOTION_VALUES)) {
        expect(rule.style.getPropertyValue(property), property).toBe(value);
        // The styles of a component, and the inline styles of the hooks, would win otherwise
        expect(rule.style.getPropertyPriority(property), property).toBe('important');
      }
    });

    it('leaves the animations and transitions alone without the preference', () => {
      renderWithGlobalStyle();

      const universalRules = findRulesSelecting({ selectors: ['*'] });
      const motionProperties = universalRules.flatMap(rule =>
        Object.keys(REDUCED_MOTION_VALUES).filter(
          property => rule.style.getPropertyValue(property) !== '',
        ),
      );
      expect(universalRules).not.toHaveLength(0);
      expect(motionProperties).toEqual([]);
    });
  });
});
