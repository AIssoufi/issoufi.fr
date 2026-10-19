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
 * A selector without the spaces around its `>`, `+` and `~` combinators, which the CSSOM keeps as
 * styled-components writes them (`.a >svg`), so that two ways of writing it compare equal.
 */
const normalizeSelector = selector => selector.trim().replace(/\s*([>+~])\s*/g, '$1');

/**
 * The selectors of a selector list, split at its commas, but not at those of a function inside a
 * selector, such as `:is(.a, .b)`.
 */
const splitSelectorList = selectorList => {
  const selectors = [''];
  let parenthesisDepth = 0;
  for (const character of selectorList) {
    if (character === '(') parenthesisDepth += 1;
    if (character === ')') parenthesisDepth -= 1;
    const isListComma = character === ',' && parenthesisDepth === 0;
    if (isListComma) selectors.push('');
    else selectors[selectors.length - 1] += character;
  }
  return selectors;
};

/**
 * Value that the generated CSS declares for a property on one of the element's classes, or on one
 * of its pseudo-elements, states or children, outside any media query or inside the given one;
 * the last declaration wins. Used by the tests, since jsdom's computed styles ignore media
 * queries, pseudo-elements and states such as `:focus-visible`.
 *
 * @param {object} params
 * @param {Element} [params.element] - Element whose classes hold the declaration.
 * @param {string} [params.property] - CSS property, such as `padding-left`.
 * @param {string} [params.media] - Condition of the media query, such as `(min-width: 50em)`;
 * `''` for the rules outside any media query.
 * @param {string} [params.pseudo] - What follows the class in the selector of the rules to read:
 * pseudo-classes, a pseudo-element or a child, such as `::after`, `:focus-visible::after` or
 * `:hover > svg`, written with or without spaces around the combinator; `''` for the rules of the
 * element itself. A rule whose selector list holds it among others counts too.
 * @returns {string} The value as the CSSOM serializes it, like a browser: a length of `0` becomes
 * `0px`, and `calc(24px - 5px)` becomes `calc(19px)` (see {@link serializeCssValue}). `''` when no
 * rule declares it, when the element is missing, or when `property` or `pseudo` is not a string.
 *
 * @example
 * declaredStyle({ element: grid, property: 'display', media: '(min-width: 50em)' }); // 'grid'
 * declaredStyle({ element: link, property: 'position', pseudo: '::after' }); // 'absolute'
 * declaredStyle({ element: button, property: 'stroke', pseudo: ':hover > svg' }); // 'rgb(…)'
 */
export const declaredStyle = ({ element, property, media = '', pseudo = '' } = {}) => {
  const hasClasses = element?.classList instanceof DOMTokenList;
  const areSelectorPartsStrings = typeof property === 'string' && typeof pseudo === 'string';
  if (!hasClasses || !areSelectorPartsStrings) return '';

  const classSelectors = [...element.classList].map(className =>
    normalizeSelector(`.${className}${pseudo}`),
  );
  const isRuleOfElement = entry => {
    const isInMedia = entry.media === media;
    // The @keyframes rules have no selector
    const selectorList = entry.rule.selectorText ?? '';
    const ruleSelectors = splitSelectorList(selectorList).map(normalizeSelector);
    return isInMedia && ruleSelectors.some(selector => classSelectors.includes(selector));
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

/** An `rgb()` or `rgba()` color, its channels separated by commas or spaces, alpha in % or not. */
const RGB_COLOR_PATTERN =
  /^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+)(%?)\s*)?\)$/i;

/** A hexadecimal color of 3 or 6 digits, such as `#fff` or `#8b3168`. */
const HEX_COLOR_PATTERN = /^#([\da-f]{3}|[\da-f]{6})$/i;

/** Largest value of a red, green or blue channel. */
const MAX_CHANNEL = 255;

/** Color channels of {@link parseColor}, alpha left out. */
const CHANNELS = ['red', 'green', 'blue'];

/**
 * Channels of a CSS color: `red`, `green` and `blue` from 0 to 255, `alpha` from 0 to 1.
 *
 * @param {unknown} value - Color written as `rgb()`, `rgba()`, or `#` and 3 or 6 hexadecimal
 * digits, as the CSSOM serializes colors and as the theme writes them.
 * @returns {{ red: number, green: number, blue: number, alpha: number } | null} `null` for any
 * other value, such as a named color, an empty string or a value that is not a string.
 *
 * @example
 * parseColor('rgba(139, 49, 104, 0.55)'); // { red: 139, green: 49, blue: 104, alpha: 0.55 }
 * parseColor('#fff'); // { red: 255, green: 255, blue: 255, alpha: 1 }
 */
export const parseColor = value => {
  if (typeof value !== 'string') return null;

  const color = value.trim();
  const hexMatch = color.match(HEX_COLOR_PATTERN);
  if (hexMatch) {
    const [, digits] = hexMatch;
    const isShortHex = digits.length === 3;
    const fullDigits = isShortHex ? [...digits].map(digit => digit + digit).join('') : digits;
    const [red, green, blue] = fullDigits.match(/../g).map(pair => Number.parseInt(pair, 16));
    return { red, green, blue, alpha: 1 };
  }

  const rgbMatch = color.match(RGB_COLOR_PATTERN);
  if (!rgbMatch) return null;

  const [, red, green, blue, alpha = '1', percentSign] = rgbMatch;
  const alphaValue = percentSign ? Number(alpha) / 100 : Number(alpha);
  const channels = [red, green, blue].map(Number);
  const areChannelsValid = channels.every(channel => channel <= MAX_CHANNEL);
  const isAlphaValid = alphaValue <= 1;
  if (!areChannelsValid || !isAlphaValid) return null;

  return { red: channels[0], green: channels[1], blue: channels[2], alpha: alphaValue };
};

/** Decimals kept in a blended channel, enough for any contrast, and never written as `1e-7`. */
const BLEND_PRECISION_DIGITS = 6;

/** Rounds a blended channel or alpha to {@link BLEND_PRECISION_DIGITS} decimals. */
const roundBlend = value => Number(value.toFixed(BLEND_PRECISION_DIGITS));

/**
 * Color seen when a translucent color is drawn over another one, as a browser composites them
 * (`source-over`): a fill over a photo, or a text over its fill.
 *
 * @param {object} params
 * @param {string} [params.foreground] - Color drawn on top, in a format of {@link parseColor}.
 * @param {string} [params.background] - Color under it, translucent or not.
 * @returns {string} The result as `rgba()`, translucent only when both colors are; `''` when
 * either color cannot be read.
 *
 * @example
 * blendColors({ foreground: 'rgba(0, 0, 0, 0.5)', background: '#ffffff' });
 * // 'rgba(127.5, 127.5, 127.5, 1)'
 */
export const blendColors = ({ foreground, background } = {}) => {
  const top = parseColor(foreground);
  const bottom = parseColor(background);
  if (!top || !bottom) return '';

  const alpha = top.alpha + bottom.alpha * (1 - top.alpha);
  if (alpha === 0) return 'rgba(0, 0, 0, 0)';

  const blendChannel = channel =>
    roundBlend(
      (top[channel] * top.alpha + bottom[channel] * bottom.alpha * (1 - top.alpha)) / alpha,
    );
  const [red, green, blue] = CHANNELS.map(blendChannel);
  return `rgba(${red}, ${green}, ${blue}, ${roundBlend(alpha)})`;
};

/**
 * Terms of the sRGB transfer function, which turns a channel value, from 0 to 1, into a light
 * intensity: a straight line up to `linearThreshold`, of slope `1 / linearSlope`, then
 * `((value + offset) / scale) ** gamma`.
 */
const SRGB_CURVE = {
  linearThreshold: 0.04045,
  linearSlope: 12.92,
  offset: 0.055,
  scale: 1.055,
  gamma: 2.4,
};

/** Weight of each channel in the relative luminance: the eye sees green as the brightest. */
const LUMINANCE_WEIGHTS = { red: 0.2126, green: 0.7152, blue: 0.0722 };

/** Light added to both luminances of a contrast ratio, for the glare of a screen. */
const CONTRAST_FLARE = 0.05;

/**
 * Smallest contrast that the Web Content Accessibility Guidelines ask of a text at level AA
 * (success criterion 1.4.3), against its background.
 */
export const MIN_TEXT_CONTRAST_RATIO = 4.5;

/**
 * Smallest contrast that the Web Content Accessibility Guidelines ask of the shapes of an icon or
 * a control against what surrounds it (success criterion 1.4.11).
 */
export const MIN_ICON_CONTRAST_RATIO = 3;

/**
 * Relative luminance of an opaque color, as the Web Content Accessibility Guidelines define it:
 * 0 for black, 1 for white. Each channel goes through the sRGB transfer function first.
 */
const getRelativeLuminance = color => {
  const toLinear = channel => {
    const value = color[channel] / MAX_CHANNEL;
    const { linearThreshold, linearSlope, offset, scale, gamma } = SRGB_CURVE;
    return value <= linearThreshold ? value / linearSlope : ((value + offset) / scale) ** gamma;
  };
  return CHANNELS.reduce((sum, channel) => sum + LUMINANCE_WEIGHTS[channel] * toLinear(channel), 0);
};

/**
 * Contrast ratio between a color and the color under it, as the Web Content Accessibility
 * Guidelines define it: from 1, for the same color, to 21, for black on white. They ask at least
 * 4.5 for a text, 3 for a large text and for the shapes of an icon or a control.
 *
 * @param {object} params
 * @param {string} [params.foreground] - Color of the text or the icon, in a format of
 * {@link parseColor}; a translucent one is first blended over the background.
 * @param {string} [params.background] - Color under it, which must be opaque: blend a translucent
 * fill over what it covers first, with {@link blendColors}.
 * @returns {number} The ratio, the same whichever color is the lighter; `NaN` when a color cannot
 * be read or the background is translucent, so that any comparison with it fails.
 *
 * @example
 * getContrastRatio({ foreground: '#ffffff', background: '#000000' }); // 21
 */
export const getContrastRatio = ({ foreground, background } = {}) => {
  const backgroundColor = parseColor(background);
  const isBackgroundOpaque = backgroundColor?.alpha === 1;
  if (!isBackgroundOpaque) return Number.NaN;

  const foregroundColor = parseColor(blendColors({ foreground, background }));
  if (!foregroundColor) return Number.NaN;

  const [darker, lighter] = [
    getRelativeLuminance(foregroundColor),
    getRelativeLuminance(backgroundColor),
  ].sort((first, second) => first - second);
  return (lighter + CONTRAST_FLARE) / (darker + CONTRAST_FLARE);
};
