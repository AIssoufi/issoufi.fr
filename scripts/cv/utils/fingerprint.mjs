// @ts-check
import { createHash } from 'node:crypto';

import { FINGERPRINT_ALGORITHM } from '../constants.mjs';

/** @typedef {import('./types.mjs').CvContent} CvContent */

/**
 * Computes the fingerprint of the content of a CV: two contents get the same one only when they
 * write the same texts and links, in the same order. The PDF itself changes at each generation,
 * since it holds its date, so its fingerprint would say nothing.
 * @param {CvContent} content - Content of the CV, from `buildCvContent`.
 * @returns {string} The hexadecimal hash of the content.
 * @example
 * getCvFingerprint(content); // 'f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2'
 */
export const getCvFingerprint = content =>
  createHash(FINGERPRINT_ALGORITHM).update(JSON.stringify(content)).digest('hex');
