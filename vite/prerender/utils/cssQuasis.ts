import {
  CSS_COMMENT_END,
  CSS_COMMENT_START,
  CSS_LINE_COMMENT_START,
  CSS_QUOTES,
  CSS_SEPARATOR,
  CSS_WHITESPACE_PATTERN,
  ESCAPE_CHARACTER,
} from '../constants.ts';

/** Parameters of {@link findCommentEnd}. */
interface FindCommentEndParams {
  /** Text of a template between two interpolations. */
  text: string;
  /** Index from which the end of the comment is searched, after its start. */
  from: number;
}

/**
 * Finds the end of a comment in a text.
 *
 * @returns The index after the end of the comment, or `undefined` when the text does not close
 * it: the comment then goes on after the next interpolation.
 */
const findCommentEnd = ({ text, from }: FindCommentEndParams) => {
  const commentEnd = text.indexOf(CSS_COMMENT_END, from);
  return commentEnd < 0 ? undefined : commentEnd + CSS_COMMENT_END.length;
};

/** Parameters of {@link readGap}. */
interface ReadGapParams {
  /** Text of a template between two interpolations. */
  text: string;
  /** Index where the run starts, outside of a string and of a comment. */
  start: number;
}

/**
 * Reads the run of whitespace and comments that starts at an index of a text, which CSS reads as
 * one space, up to a comment that the text does not close.
 *
 * @returns The index after the run, which is `start` when there is none, and whether it holds
 * whitespace: without any, its comments alone separate two tokens.
 */
const readGap = ({ text, start }: ReadGapParams) => {
  let end = start;
  let hasWhitespace = false;
  while (end < text.length) {
    if (CSS_WHITESPACE_PATTERN.test(text.charAt(end))) {
      hasWhitespace = true;
      end += 1;
      continue;
    }
    const isCommentStart = text.startsWith(CSS_COMMENT_START, end);
    const commentEnd = isCommentStart
      ? findCommentEnd({ text, from: end + CSS_COMMENT_START.length })
      : undefined;
    if (commentEnd === undefined) break;
    end = commentEnd;
  }
  return { end, hasWhitespace };
};

/**
 * Minifies the texts of a CSS template, between its interpolations: replaces each run of
 * whitespace and comments with one space, as CSS reads it. It keeps the strings, a run of comments
 * without whitespace, which separates two tokens, and a comment that goes on after an
 * interpolation. A template that holds an escape (see {@link ESCAPE_CHARACTER}), a line comment
 * (see {@link CSS_LINE_COMMENT_START}), or a string or a comment that it does not close stays as
 * it is.
 *
 * @param quasis - Raw texts of the template, around its interpolations.
 * @returns The minified texts, as many as the template has.
 *
 * @example
 * minifyCssQuasis(['\n  color: red; /* text *\/\n  margin: ', ';\n']);
 * // [' color: red; margin: ', '; ']
 */
export const minifyCssQuasis = (quasis: readonly string[]): string[] => {
  const hasEscape = quasis.some(text => text.includes(ESCAPE_CHARACTER));
  if (hasEscape) return [...quasis];

  let quote: string | undefined;
  let isInComment = false;
  const minified: string[] = [];
  for (const text of quasis) {
    let result = '';
    let index = 0;
    while (index < text.length) {
      const character = text.charAt(index);
      if (isInComment) {
        const commentEnd = findCommentEnd({ text, from: index });
        isInComment = commentEnd === undefined;
        const next = commentEnd ?? text.length;
        result += text.slice(index, next);
        index = next;
        continue;
      }
      if (quote !== undefined) {
        if (character === quote) quote = undefined;
        result += character;
        index += 1;
        continue;
      }
      if (CSS_QUOTES.has(character)) {
        quote = character;
        result += character;
        index += 1;
        continue;
      }
      if (text.startsWith(CSS_LINE_COMMENT_START, index)) return [...quasis];

      const gap = readGap({ text, start: index });
      if (gap.end > index) {
        result += gap.hasWhitespace ? CSS_SEPARATOR : text.slice(index, gap.end);
        index = gap.end;
        continue;
      }
      // A comment that the text does not close, which goes on after the next interpolation
      if (text.startsWith(CSS_COMMENT_START, index)) {
        isInComment = true;
        result += CSS_COMMENT_START;
        index += CSS_COMMENT_START.length;
        continue;
      }
      result += character;
      index += 1;
    }
    minified.push(result);
  }

  const isClosed = quote === undefined && !isInComment;
  return isClosed ? minified : [...quasis];
};
