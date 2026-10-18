// @ts-check
import { extname } from 'node:path';

import { IMAGE_MEDIA_TYPES } from '../constants.mjs';

/**
 * Parameters of {@link toImageDataUrl}.
 * @typedef {object} ToImageDataUrlParams
 * @property {Buffer} content - Content of the image file.
 * @property {string} fileName - Name or path of the file, whose extension gives the media type.
 */

/**
 * Turns an image file into a data URL, so the page rendered by Chromium, which is not served
 * from the project, can show it.
 * @param {ToImageDataUrlParams} params
 * @returns {string} The data URL, e.g. `data:image/webp;base64,UklGR…`.
 * @throws {RangeError} When the extension of the file is not one of {@link IMAGE_MEDIA_TYPES}.
 * @example
 * toImageDataUrl({ content: readFileSync('public/home.webp'), fileName: 'public/home.webp' });
 */
export const toImageDataUrl = ({ content, fileName }) => {
  const extension = extname(fileName).toLowerCase();
  const mediaType = IMAGE_MEDIA_TYPES[/** @type {keyof IMAGE_MEDIA_TYPES} */ (extension)];
  if (!mediaType) throw new RangeError(`Unknown image type: ${fileName}`);

  return `data:${mediaType};base64,${content.toString('base64')}`;
};
