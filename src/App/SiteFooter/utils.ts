import { VERSION_PREFIX } from './constants';

/**
 * Removes the leading `v` of a version written as a tag, as in `v1.0.0`, so the formatted version
 * never gets two.
 */
const removeVersionPrefix = (version: string): string => {
  const isWrittenAsTag = version.toLowerCase().startsWith(VERSION_PREFIX);
  return isWrittenAsTag ? version.slice(VERSION_PREFIX.length) : version;
};

/**
 * Formats the version of the site as the site footer shows it: the version number after a `v`.
 *
 * @param version - Version as `package.json` writes it, e.g. `1.0.0`. One that already starts
 * with a `v` keeps a single one.
 * @returns `v<version>`, trimmed, or an empty string when the version is missing, empty or not a
 * string, so the footer never shows `undefined` or `v` alone.
 *
 * @example
 * formatVersion('1.0.0'); // 'v1.0.0'
 * formatVersion('v2.3.4'); // 'v2.3.4'
 * formatVersion(''); // ''
 */
export const formatVersion = (version?: string): string => {
  const text = typeof version === 'string' ? version.trim() : '';
  const versionNumber = removeVersionPrefix(text).trim();
  return versionNumber ? `${VERSION_PREFIX}${versionNumber}` : '';
};
