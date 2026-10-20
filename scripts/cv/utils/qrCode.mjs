// @ts-check
import { renderSVG } from 'uqr';

import { QR_CODE_ATTRIBUTES, QR_CODE_OPTIONS, SVG_OPENING_PATTERN } from '../constants.mjs';
import { isFilled, toText } from './data.mjs';

/**
 * Draws the QR code of a URL as an inline `svg` element of the page of the CV: its dark modules
 * in the color of its text, on nothing, hidden from screen readers.
 * @param {unknown} url - URL that the QR code leads to, `''` for a CV without QR code.
 * @returns {string} The `svg` element, or `''` when `url` is empty or not a text.
 * @example
 * renderQrCode('https://issoufi.fr/');
 * // '<svg class="qr-code" aria-hidden="true" xmlns="…" viewBox="0 0 250 250">…</svg>'
 */
export const renderQrCode = url => {
  const text = toText(url);
  if (!isFilled(text)) return '';
  return renderSVG(text, QR_CODE_OPTIONS).replace(
    SVG_OPENING_PATTERN,
    `<svg ${QR_CODE_ATTRIBUTES}`,
  );
};
