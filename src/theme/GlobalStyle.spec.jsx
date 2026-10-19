import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { screen } from '@testing-library/react';
import styled, { ThemeProvider } from '@xstyled/styled-components';

import { listStyleRules, serializeCssValue } from '../styleTestUtils.js';
import { FORCED_COLORS_QUERY, HOVER_POINTER_QUERY, REDUCED_MOTION_QUERY } from './constants.ts';
import { GlobalStyle } from './GlobalStyle.ts';
import { theme } from './theme.ts';

// The render of src/setupTests.ts adds the global styles already, and in styled-components 6.5 each
// mounted copy of a global style adds its own rules: Testing Library's own render keeps the global
// styles of the spec alone in the document
const { render } = await vi.importActual('@testing-library/react');

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

/** Folder of the sources of the app, whose icons the global style colors. */
const SOURCE_DIR = 'src';

/**
 * Stroke color written in an SVG file: a `stroke` attribute, such as `stroke="white"` or
 * `stroke='white'`, or a `stroke` declaration of a style, such as `style="stroke: white"` or
 * `<style>path { stroke: white }</style>`.
 */
const STROKE_COLOR = /\sstroke=["'][^"']*["']|[\s;{"']stroke\s*:[^;}"']*/g;

/** Every SVG file of the app, by its path from the root of the repository. */
const iconFiles = readdirSync(SOURCE_DIR, { recursive: true })
  .map(String)
  .filter(file => file.endsWith('.svg'))
  .map(file => join(SOURCE_DIR, file));

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

  it('balances the lines of every heading, and keeps a paragraph from ending on a word alone', () => {
    renderWithGlobalStyle();

    const [headingRule] = findRulesSelecting({ selectors: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] });
    const [paragraphRule] = findRulesSelecting({ selectors: ['p'] });
    expect(headingRule.style.getPropertyValue('text-wrap')).toBe('balance');
    expect(paragraphRule.style.getPropertyValue('text-wrap')).toBe('pretty');
  });

  it('grows a hovered button, and turns a hovered link to the accent from tablet up, under a pointer that hovers only', () => {
    renderWithGlobalStyle();
    const tabletHoverQuery = `(min-width: ${theme.screens.tablet}) and ${HOVER_POINTER_QUERY}`;

    const [buttonRule] = findRulesSelecting({
      selectors: ['button:hover'],
      media: HOVER_POINTER_QUERY,
    });
    const [linkRule] = findRulesSelecting({ selectors: ['a:hover'], media: tabletHoverQuery });
    expect(buttonRule.style.getPropertyValue('transform')).toBe('scale(1.06)');
    expect(linkRule.style.getPropertyValue('color')).toBe(
      serializeCssValue({ property: 'color', value: theme.colors['accent-foreground'] }),
    );
    // A touch screen keeps the hover style of the last control tapped
    const isHoverRuleOfEveryPointer = ({ media, rule }) => {
      const isForHoverPointers = media.endsWith(HOVER_POINTER_QUERY);
      return !isForHoverPointers && Boolean(rule.selectorText?.includes(':hover'));
    };
    expect(listStyleRules().filter(isHoverRuleOfEveryPointer)).toEqual([]);
  });

  it('draws the icons in the foreground color, and in the text color in forced colors mode', () => {
    renderWithGlobalStyle();

    const iconRules = findRulesSelecting({ selectors: ['svg'] });
    const forcedIconRules = findRulesSelecting({ selectors: ['svg'], media: FORCED_COLORS_QUERY });
    expect(iconRules).toHaveLength(1);
    expect(forcedIconRules).toHaveLength(1);
    const [iconRule] = iconRules;
    const [forcedIconRule] = forcedIconRules;
    expect(iconRule.style.getPropertyValue('stroke')).toBe(
      serializeCssValue({ property: 'stroke', value: theme.colors.foreground }),
    );
    // Forced colors mode keeps the white of an SVG, which a light contrast theme would hide
    expect(forcedIconRule.style.getPropertyValue('stroke')).toBe(
      serializeCssValue({ property: 'stroke', value: 'currentColor' }),
    );
  });

  it('leaves the stroke color of every icon of the app to the global style', () => {
    expect(iconFiles).not.toHaveLength(0);
    // A stroke on a path would win over the text color that the icons need in forced colors mode
    for (const file of iconFiles) {
      expect(readFileSync(file, 'utf8').match(STROKE_COLOR), file).toBeNull();
    }
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
