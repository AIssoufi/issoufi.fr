/**
 * Finds the source of a function in a CSS rule: an arrow, or the `function` keyword before its
 * parameters (a plain `transition-timing-function` has none). No valid CSS of the app holds one.
 */
const FUNCTION_SOURCE_PATTERN = /=>|\bfunction\s*\(/;

/**
 * Whether a CSS rule holds the source of a function, as styled-components writes it for a
 * function interpolated in a plain template string instead of a `css` block, such as a `th`
 * helper. Browsers drop such a rule.
 *
 * @param rule - Text of the CSS rule.
 * @returns `false` for a rule without one, and for a value that is not a string.
 *
 * @example
 * holdsFunctionSource('.a:hover color:(props) => getValue(props){}'); // true
 * holdsFunctionSource('.a { transition-timing-function: ease; }'); // false
 */
export const holdsFunctionSource = (rule: unknown): boolean =>
  typeof rule === 'string' && FUNCTION_SOURCE_PATTERN.test(rule);

/**
 * Makes the `insertRule` of a style sheet prototype log with `console.error` each rule that
 * browsers would drop: one holding the source of a function, which jsdom keeps, and one that the
 * CSSOM refuses, which styled-components skips without a word. `src/setupTests.ts` applies it to
 * `CSSStyleSheet.prototype`, so that a test inserting such a rule fails.
 *
 * @param styleSheetPrototype - Object whose `insertRule` is wrapped, such as
 * `CSSStyleSheet.prototype`; the rule is still inserted, and a refusal still throws.
 */
export const logDroppedCssRules = (styleSheetPrototype: Pick<CSSStyleSheet, 'insertRule'>) => {
  const nativeInsertRule = styleSheetPrototype.insertRule;
  styleSheetPrototype.insertRule = function insertRule(
    this: CSSStyleSheet,
    rule: string,
    index?: number,
  ) {
    if (holdsFunctionSource(rule)) {
      console.error(`CSS rule holding the source of a function, which browsers drop: ${rule}`);
    }
    try {
      return nativeInsertRule.call(this, rule, index);
    } catch (error) {
      console.error(`CSS rule refused by the CSSOM, which browsers drop: ${rule}`, error);
      throw error;
    }
  };
};
