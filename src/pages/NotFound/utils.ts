/**
 * Decodes the percent-encoded characters of a path, such as the spaces and accents of a link shared
 * by mail, so that the not found page names it as the visitor reads it. Like `decodeURI`, it keeps
 * the escapes of the characters that structure a URL, such as `%2F` (`/`) and `%3F` (`?`).
 *
 * @param path - Path to decode, such as the `pathname` of the current location.
 * @returns The decoded path, the path as given when it holds a malformed escape such as
 * `%E0%A4%A`, and an empty string when it is not a string.
 *
 * @example
 * decodePath('/un%20lien%20partag%C3%A9'); // '/un lien partagé'
 * decodePath('/a%2Fb'); // '/a%2Fb'
 * decodePath('/100%'); // '/100%', malformed
 */
export const decodePath = (path?: string | null): string => {
  if (typeof path !== 'string') return '';

  try {
    return decodeURI(path);
  } catch {
    // A malformed escape cannot be decoded: show the path as it is in the URL
    return path;
  }
};
