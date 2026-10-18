import { VERSION_PREFIX } from './constants';

/** Parameters of {@link formatSiteVersion}. */
interface FormatSiteVersionParams {
  /** Name of the site, written first, e.g. `issoufi.fr`. */
  siteName?: string;
  /** Version of the site, with or without its leading `v`, e.g. `1.0.0`. */
  version?: string;
}

/** Trims a value when it is a string, and turns anything else into an empty string. */
const toTrimmedText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Removes the leading `v` of a version written as a tag, as in `v1.0.0`, so the formatted version
 * never gets two.
 */
const removeVersionPrefix = (version: string): string => {
  const isWrittenAsTag = version.toLowerCase().startsWith(VERSION_PREFIX);
  return isWrittenAsTag ? version.slice(VERSION_PREFIX.length) : version;
};

/**
 * Formats the name and the version of the site as the site badge shows them: the name, then the
 * version number after a `v`.
 *
 * @returns `<siteName> v<version>`, each part trimmed. A version that already starts with a `v`
 * keeps a single one. A part that is missing, empty or not a string is left out, with its space,
 * so the text never shows `undefined` or `v` alone: an empty string when both are.
 *
 * @example
 * formatSiteVersion({ siteName: 'issoufi.fr', version: '1.0.0' }); // 'issoufi.fr v1.0.0'
 * formatSiteVersion({ siteName: 'issoufi.fr', version: 'v2.3.4' }); // 'issoufi.fr v2.3.4'
 * formatSiteVersion({ siteName: 'issoufi.fr' }); // 'issoufi.fr'
 */
export const formatSiteVersion = ({ siteName, version }: FormatSiteVersionParams = {}): string => {
  const versionNumber = removeVersionPrefix(toTrimmedText(version)).trim();
  const versionLabel = versionNumber ? `${VERSION_PREFIX}${versionNumber}` : '';

  return [toTrimmedText(siteName), versionLabel].filter(Boolean).join(' ');
};
