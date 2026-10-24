/**
 * HTTP headers that Cloudflare Pages adds to its responses for the paths that match a pattern: a
 * block of the `_headers` file of the build, written by `renderHeaderRules` (`utils.ts`).
 * @see https://developers.cloudflare.com/pages/configuration/headers/
 */
export interface HeaderRule {
  /**
   * Path pattern of the URLs to answer with these headers, starting with `/`, where `*` matches
   * any part of a path, e.g. `/assets/*`. It may start with `https://` and a host, to answer only
   * the URLs of that host, e.g. `https://issoufi-fr.pages.dev/*`.
   */
  path: string;
  /** Value of each header, by name, e.g. `{ 'Cache-Control': 'no-store' }`. */
  headers: Readonly<Record<string, string>>;
}

/**
 * API of the plugin of `vite.config.ts` that writes the HTML file of each page
 * (`PAGE_META_PLUGIN_NAME`), which another config reaches through `config.plugins`.
 */
export interface PageMetaApi {
  /**
   * Writes the pages without the app rendered in them, which the browser then renders from
   * scratch, as in the standalone build: its router reads the hash of the URL, which no page
   * rendered at build time knows. To call before the build starts, as from `configResolved`.
   */
  skipPrerender: () => void;
}

/**
 * API of the plugin of `vite.config.ts` that adds the web fonts to the head of every page
 * (`FONT_FACES_PLUGIN_NAME`), which another config reaches through `config.plugins`.
 */
export interface FontFacesApi {
  /**
   * Makes the pages load the font files from `public/fonts/`, as the dev server does, instead of
   * the copies that the build writes in `assets/` under a hash of their content, as in the
   * standalone build, which embeds the files of `public/` in its page. To call before the build
   * starts, as from `configResolved`.
   */
  keepPublicUrls: () => void;
}
