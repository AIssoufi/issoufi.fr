// @ts-check
import {
  LINK_PROTOCOLS,
  TRAILING_SLASHES_PATTERN,
  WEB_PROTOCOLS,
  WWW_PREFIX,
} from '../constants.mjs';

/**
 * Reads a URL of the data that the CV can write as a link.
 * @param {unknown} value - URL to read.
 * @returns {string} The URL, or `''` when it is not a URL, or its scheme is not one of
 * {@link LINK_PROTOCOLS}, as `javascript:`.
 */
export const toLinkUrl = value => {
  const url = typeof value === 'string' ? value : '';
  const isLink = URL.canParse(url) && LINK_PROTOCOLS.has(new URL(url).protocol);
  return isLink ? url : '';
};

/**
 * Writes a web address the way people read it: without its scheme, `www.` and the slash that
 * ends it.
 * @param {unknown} value - Web address, e.g. `https://www.linkedin.com/in/issoufiadam/`.
 * @returns {string} The address to write, e.g. `linkedin.com/in/issoufiadam`, or `''` when it is
 * not a web address.
 * @example
 * toLinkText('https://github.com/AIssoufi'); // 'github.com/AIssoufi'
 */
export const toLinkText = value => {
  const url = toLinkUrl(value);
  const isWebAddress = url !== '' && WEB_PROTOCOLS.has(new URL(url).protocol);
  if (!isWebAddress) return '';

  const { host, pathname } = new URL(url);
  const domain = host.startsWith(WWW_PREFIX) ? host.slice(WWW_PREFIX.length) : host;
  return `${domain}${pathname}`.replace(TRAILING_SLASHES_PATTERN, '');
};
