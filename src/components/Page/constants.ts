/** `background-image` of a page without a background photo: only the overlay is drawn. */
export const NO_BACKGROUND_IMAGE = 'none';

/** Characters that end or escape a CSS string written between double quotes. */
export const CSS_STRING_SPECIAL_CHARACTERS = /["\\]/g;

/**
 * Line breaks, which also end a CSS string: they are written as the escape of their code point,
 * `\a `, rather than as such.
 */
export const CSS_STRING_LINE_BREAKS = /[\n\r\f]/g;

/** Base of the code point of an escaped character in a CSS string. */
export const CSS_ESCAPE_RADIX = 16;
