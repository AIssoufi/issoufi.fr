import {
  HEADER_INDENT,
  HEADER_NAME_PATTERN,
  HEADER_PATH_PATTERN,
  HEADER_RULES,
  LINE_BREAK_PATTERN,
} from '../constants.ts';
import type { HeaderRule } from '../types.ts';

/**
 * Tells whether a header can be written on a line of `_headers`: its name is an HTTP token and
 * its value a string that is not blank and holds no line break.
 */
const isWritableHeader = ([name, value]: [string, unknown]): boolean => {
  const isWritableValue =
    typeof value === 'string' && value.trim() !== '' && !LINE_BREAK_PATTERN.test(value);
  return HEADER_NAME_PATTERN.test(name) && isWritableValue;
};

/**
 * Writes a rule of `_headers`: its path, then each header on a line of its own, indented.
 *
 * @param rule - Rule to write, from a list that may hold anything.
 * @returns The block of the rule, without a trailing line break, or `''` when the rule is not an
 * object, its path is not a path pattern (see `HEADER_PATH_PATTERN`) or it has no header to write.
 */
const renderHeaderRule = (rule: unknown): string => {
  const isObject = typeof rule === 'object' && rule !== null;
  if (!isObject) return '';

  const { path, headers } = rule as Partial<HeaderRule>;
  const hasPath = typeof path === 'string' && HEADER_PATH_PATTERN.test(path);
  const hasHeaders = typeof headers === 'object' && headers !== null && !Array.isArray(headers);
  if (!hasPath || !hasHeaders) return '';

  const lines = Object.entries(headers)
    .filter(isWritableHeader)
    .map(([name, value]) => `${HEADER_INDENT}${name}: ${value.trim()}`);
  return lines.length > 0 ? [path, ...lines].join('\n') : '';
};

/** Parameters of {@link renderHeaderRules}. */
interface RenderHeaderRulesParams {
  /**
   * Rules to write. Defaults to {@link HEADER_RULES}. Any value that is not an array counts as
   * none, and a rule without a path pattern or without a header to write is left out, as is a
   * header whose name is not an HTTP token or whose value is blank or holds a line break.
   */
  rules?: readonly HeaderRule[];
}

/**
 * Writes the `_headers` file that the `http-headers` plugin of `vite.config.ts` adds to the root
 * of the build: the HTTP headers that Cloudflare Pages adds to its responses, by path. Each rule
 * is its path, then each header indented on a line of its own, and a blank line parts the rules.
 *
 * @returns The content of the file, ending with a line break, or `''` when there is no rule to
 * write.
 *
 * @example
 * renderHeaderRules({ rules: [{ path: '/assets/*', headers: { 'Cache-Control': 'immutable' } }] });
 * // '/assets/*\n  Cache-Control: immutable\n'
 */
export const renderHeaderRules = ({
  rules = HEADER_RULES,
}: RenderHeaderRulesParams = {}): string => {
  const blocks = (Array.isArray(rules) ? rules : []).map(renderHeaderRule).filter(Boolean);
  return blocks.length > 0 ? `${blocks.join('\n\n')}\n` : '';
};
