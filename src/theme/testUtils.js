/**
 * Units of the lengths that must come from a token: absolute ones and those relative to a font.
 * Percentages and viewport units are proportions of the parent or of the screen, so they may stay
 * raw.
 */
const TOKEN_LENGTH_UNITS = ['px', 'rem', 'em', 'ch', 'ex', 'lh', 'cm', 'mm', 'in', 'pt', 'pc'];

/** Units of durations, which come from the `durations` tokens. */
const DURATION_UNITS = ['ms', 's'];

/** CSS color names that a style file could write instead of a `colors` token. */
const NAMED_COLORS = [
  'black',
  'white',
  'gray',
  'grey',
  'silver',
  'red',
  'maroon',
  'orange',
  'yellow',
  'olive',
  'lime',
  'green',
  'teal',
  'cyan',
  'aqua',
  'blue',
  'navy',
  'purple',
  'magenta',
  'fuchsia',
  'pink',
];

/** Easing keywords, which come from the `timingFunctions` tokens. */
const EASING_KEYWORDS = [
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'linear',
  'step-start',
  'step-end',
];

/** Properties whose unitless values come from a scale of the theme. */
const SCALED_PROPERTIES = ['z-index', 'font-weight', 'line-height'];

/** Start of a word: not preceded by a letter, a digit, a dot, a dollar sign or a hyphen. */
const WORD_START = '(?<![\\w.$#-])';
/** End of a word: not followed by a letter, a digit or a hyphen. */
const WORD_END = '(?![\\w-])';
/** A number, such as `12`, `-0.5` or `.5`. */
const NUMBER = '-?(?:\\d+(?:\\.\\d+)?|\\.\\d+)';

/** Kinds of raw values, each with the pattern that finds them in a line of a style file. */
const RAW_VALUE_PATTERNS = [
  {
    kind: 'length',
    pattern: new RegExp(
      `${WORD_START}(${NUMBER})(?:${TOKEN_LENGTH_UNITS.join('|')})${WORD_END}`,
      'gi',
    ),
  },
  {
    kind: 'duration',
    pattern: new RegExp(`${WORD_START}(${NUMBER})(?:${DURATION_UNITS.join('|')})${WORD_END}`, 'gi'),
  },
  {
    kind: 'color',
    pattern: new RegExp(
      `#[\\da-f]{3,8}\\b|${WORD_START}(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(|` +
        `${WORD_START}(?:${NAMED_COLORS.join('|')})${WORD_END}`,
      'gi',
    ),
  },
  {
    kind: 'easing',
    pattern: new RegExp(
      `${WORD_START}(?:cubic-bezier|steps)\\(|${WORD_START}(?:${EASING_KEYWORDS.join('|')})${WORD_END}`,
      'g',
    ),
  },
  {
    kind: 'scale',
    pattern: new RegExp(
      `${WORD_START}(?:${SCALED_PROPERTIES.join('|')})\\s*:\\s*${NUMBER}${WORD_END}`,
      'g',
    ),
  },
];

/** Block comments, line comments (after a space or at the start of a line) and token calls. */
const IGNORED_CODE = /\/\*[\s\S]*?\*\/|(?<=^|\s)\/\/.*$|\bth(?:\.\w+)?\([^)]*\)/gm;

/** Replaces each character of a match with a space, keeping its line breaks. */
const blankOut = match => match.replace(/[^\n]/g, ' ');

/** Whether a number found with a unit is zero, the same value in every scale. */
const isZero = number => number !== undefined && Number(number) === 0;

/**
 * Values written by hand in the source of a style file that should come from a token of the
 * theme: lengths in pixels or in units relative to a font, durations, colors, easings, and raw
 * z-indexes, font weights and line heights. Used by the theme spec to refuse them in every style
 * file.
 *
 * It ignores comments, the `th` helpers and their arguments (`th.space(-8)`), and the named
 * constants interpolated with a unit (`${BUTTON_WIDTH_PX}px`). It allows zero with any unit,
 * percentages, viewport units (`100vh`), angles, `fr`, unitless numbers (scale factors,
 * opacities, flex factors) and keywords such as `transparent` or `currentColor`.
 *
 * @param {unknown} source - Source code of a style file.
 * @returns {{ line: number, kind: string, value: string }[]} Each raw value with its line,
 * counted from 1, in the order of the source; empty when `source` is not a string.
 *
 * @example
 * findRawValues('  height: 72px;\n  color: ${th.color(\'accent\')};');
 * // [{ line: 1, kind: 'length', value: '72px' }]
 */
export const findRawValues = source => {
  if (typeof source !== 'string') return [];
  const code = source.replace(IGNORED_CODE, blankOut);

  return code.split('\n').flatMap((text, index) =>
    RAW_VALUE_PATTERNS.flatMap(({ kind, pattern }) =>
      [...text.matchAll(pattern)]
        .filter(([, number]) => !isZero(number))
        .map(match => ({ line: index + 1, column: match.index, kind, value: match[0].trim() })),
    )
      .sort((first, second) => first.column - second.column)
      .map(({ line, kind, value }) => ({ line, kind, value })),
  );
};
