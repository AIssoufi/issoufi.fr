// @ts-check
import { COMMIT_SHA_PATTERN, SHORT_SHA_LENGTH } from '../constants.mjs';

/**
 * Tells whether a value is the full SHA of a git commit, as `git rev-parse` writes it.
 * @param {unknown} value - Value to check.
 * @returns {value is string} False for a short or uppercase SHA, a branch name and a value that
 * is not a string.
 * @example
 * isCommitSha('58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8'); // true
 * isCommitSha('58ff9ea'); // false
 */
export const isCommitSha = value => typeof value === 'string' && COMMIT_SHA_PATTERN.test(value);

/**
 * Shortens a commit SHA the way git shows it.
 * @param {unknown} sha - SHA to shorten.
 * @returns {string} Its first {@link SHORT_SHA_LENGTH} digits, or an empty string when it is not
 * a string.
 * @example
 * shortenSha('58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8'); // '58ff9ea'
 */
export const shortenSha = sha => (typeof sha === 'string' ? sha.slice(0, SHORT_SHA_LENGTH) : '');
