/**
 * Every style rule of the document, with the condition of the media query holding it, if any.
 *
 * @returns {{ media: string, rule: CSSRule }[]} `media` is `''` for a rule outside any media query.
 */
export const listStyleRules = () =>
  [...document.styleSheets].flatMap(sheet =>
    [...sheet.cssRules].flatMap(rule =>
      rule instanceof CSSMediaRule
        ? [...rule.cssRules].map(innerRule => ({ media: rule.media.mediaText, rule: innerRule }))
        : [{ media: '', rule }],
    ),
  );

/**
 * Value that the generated CSS declares for a property on one of the element's classes, or on one
 * of its pseudo-elements or states, outside any media query or inside the given one; the last
 * declaration wins. Used by the tests, since jsdom's computed styles ignore media queries,
 * pseudo-elements and states such as `:focus-visible`.
 *
 * @param {object} params
 * @param {Element} [params.element] - Element whose classes hold the declaration.
 * @param {string} [params.property] - CSS property, such as `padding-left`.
 * @param {string} [params.media] - Condition of the media query, such as `(min-width: 50em)`;
 * `''` for the rules outside any media query.
 * @param {string} [params.pseudo] - Pseudo-classes and pseudo-element that follow the class in the
 * selector of the rules to read, such as `::after` or `:focus-visible::after`; `''` for the rules
 * of the element itself.
 * @returns {string} The value as the CSSOM serializes it, like a browser: a length of `0` becomes
 * `0px`, and `calc(24px - 5px)` becomes `calc(19px)` (see {@link serializeCssValue}). `''` when no
 * rule declares it, when the element is missing, or when `property` or `pseudo` is not a string.
 *
 * @example
 * declaredStyle({ element: grid, property: 'display', media: '(min-width: 50em)' }); // 'grid'
 * declaredStyle({ element: link, property: 'position', pseudo: '::after' }); // 'absolute'
 */
export const declaredStyle = ({ element, property, media = '', pseudo = '' } = {}) => {
  const hasClasses = element?.classList instanceof DOMTokenList;
  const areSelectorPartsStrings = typeof property === 'string' && typeof pseudo === 'string';
  if (!hasClasses || !areSelectorPartsStrings) return '';

  const classSelectors = [...element.classList].map(className => `.${className}${pseudo}`);
  const isRuleOfElement = entry => {
    const isInMedia = entry.media === media;
    return isInMedia && classSelectors.includes(entry.rule.selectorText);
  };
  const values = listStyleRules()
    .filter(isRuleOfElement)
    .map(({ rule }) => rule.style.getPropertyValue(property));
  return values.findLast(Boolean) ?? '';
};

/**
 * A CSS value as the CSSOM serializes it, so that a test can compare it with what
 * {@link declaredStyle} returns: a length of `0` becomes `0px`, and a `calc()` whose terms share a
 * unit is reduced to its result.
 *
 * @param {object} params
 * @param {string} [params.property] - CSS property the value is written for, such as
 * `padding-left`.
 * @param {string} [params.value] - Value as written in the styles, such as `calc(24px - 5px)`.
 * @returns {string} `''` when the value is invalid for the property, or when either is missing or
 * not a string.
 *
 * @example
 * serializeCssValue({ property: 'padding-left', value: 'calc(24px - 5px)' }); // 'calc(19px)'
 * serializeCssValue({ property: 'inset', value: '0' }); // '0px'
 */
export const serializeCssValue = ({ property, value } = {}) => {
  const areStrings = typeof property === 'string' && typeof value === 'string';
  if (!areStrings) return '';

  const { style } = document.createElement('div');
  style.setProperty(property, value);
  return style.getPropertyValue(property);
};
