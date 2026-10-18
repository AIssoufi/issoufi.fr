/**
 * HTTP headers that Cloudflare Pages adds to its responses for the paths that match a pattern: a
 * block of the `_headers` file of the build, written by `renderHeaderRules` (`utils.ts`).
 * @see https://developers.cloudflare.com/pages/configuration/headers/
 */
export interface HeaderRule {
  /**
   * Path pattern of the URLs to answer with these headers, starting with `/`, where `*` matches
   * any part of a path, e.g. `/assets/*`.
   */
  path: string;
  /** Value of each header, by name, e.g. `{ 'Cache-Control': 'no-store' }`. */
  headers: Readonly<Record<string, string>>;
}
