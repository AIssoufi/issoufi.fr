// @ts-check
import { MEDIA_TYPE_PARAMETERS_PATTERN } from '../constants.mjs';

/**
 * Reads the media type of a `Content-Type` header: its value without its parameters, in lower case,
 * as media types are compared.
 * @param {unknown} contentType - Value of the header, e.g. `Application/JSON; charset=utf-8`.
 * @returns {string} The media type, e.g. `application/json`, or `''` for a missing header or a
 * value that is not a string.
 * @example
 * getMediaType('application/manifest+json; charset=utf-8'); // 'application/manifest+json'
 */
export const getMediaType = contentType =>
  typeof contentType === 'string'
    ? contentType.replace(MEDIA_TYPE_PARAMETERS_PATTERN, '').trim().toLowerCase()
    : '';
