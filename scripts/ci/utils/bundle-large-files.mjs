// @ts-check
import { IMAGE_FILE_PATTERN, LARGE_FILE_ADVICE, LARGE_IMAGE_ADVICE } from '../constants.mjs';
import { isBudgetedScript, isBuildFile } from './bundle-files.mjs';
import { toList } from './lists.mjs';
import { isPositiveNumber, toNonNegativeNumber } from './numbers.mjs';

/** @typedef {import('./bundle-files.mjs').BuildFile} BuildFile */

/**
 * Parameters of {@link findLargeFiles}.
 * @typedef {object} FindLargeFilesParams
 * @property {BuildFile[]} [files] - Files of the build, of any type. Any value that is not an array
 * counts as none.
 * @property {number} limitBytes - Size above which a file is listed. A file of exactly this size
 * is not.
 */

/**
 * Lists the files of the build that are bigger than a size limit, the biggest first: images, the
 * CV or any other file, except the scripts and style sheets that the gzip budgets already check
 * (see {@link isBudgetedScript}).
 * @param {FindLargeFilesParams} params
 * @returns {BuildFile[]} The files over the limit.
 * @throws {RangeError} When the limit is not a finite number above 0, since no file would then be
 * reported, or every one.
 * @example
 * findLargeFiles({
 *   files: [
 *     { path: 'assets/index.js', bytes: 788_320 },
 *     { path: 'small.png', bytes: 100 },
 *     { path: 'cv.pdf', bytes: 3_851_658 },
 *     { path: 'chess.png', bytes: 928_988 },
 *   ],
 *   limitBytes: 500_000,
 * }); // [{ path: 'cv.pdf', bytes: 3_851_658 }, { path: 'chess.png', bytes: 928_988 }]
 */
export const findLargeFiles = ({ files, limitBytes }) => {
  const isValidLimit = isPositiveNumber(limitBytes);
  if (!isValidLimit) throw new RangeError(`Invalid file size limit: ${limitBytes}`);

  const isLargeFile = (/** @type {unknown} */ file) =>
    isBuildFile(file) &&
    !isBudgetedScript(file.path) &&
    toNonNegativeNumber(file.bytes) > limitBytes;

  return toList(files)
    .filter(isLargeFile)
    .sort((a, b) => b.bytes - a.bytes);
};

/**
 * Tells how to make a large file of the build lighter, for the warning about its size: images can
 * also move to a lighter format.
 * @param {unknown} path - Path relative to the build folder, e.g. `chess.png`.
 * @returns {string} {@link LARGE_IMAGE_ADVICE} for an image, {@link LARGE_FILE_ADVICE} for any
 * other file and for a path that is not a string.
 * @example
 * getCompressionAdvice('chess.png'); // 'Compress it or convert it to WebP or AVIF.'
 * getCompressionAdvice('cv.pdf'); // 'Compress it.'
 */
export const getCompressionAdvice = path => {
  const isImage = typeof path === 'string' && IMAGE_FILE_PATTERN.test(path);
  return isImage ? LARGE_IMAGE_ADVICE : LARGE_FILE_ADVICE;
};
