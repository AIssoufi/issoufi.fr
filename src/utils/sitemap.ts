import { getPageAlternates, getPageFiles, getPageUrl, type PageFile, SITE_URL } from './pages';

/**
 * Name of the sitemap in the build, served at the root of the site, where search engines look for
 * it and where `public/robots.txt` points them to (see {@link SITEMAP_URL}).
 */
export const SITEMAP_FILE_NAME = 'sitemap.xml';

/** Absolute URL of the sitemap, which `public/robots.txt` declares on its `Sitemap:` line. */
export const SITEMAP_URL = `${SITE_URL}/${SITEMAP_FILE_NAME}`;

/** Namespace of the elements of the sitemap protocol, https://www.sitemaps.org/protocol.html. */
export const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

/**
 * Namespace of the `xhtml:link` elements, which list the translations of each URL of the sitemap:
 * https://developers.google.com/search/docs/specialty/international/localized-versions#sitemap.
 */
export const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

/** First line of the sitemap, which the protocol requires to be in UTF-8. */
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

/** Characters that XML reads as markup, and the entity that writes each one as text. */
const XML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/** Characters of {@link XML_ENTITIES}. */
const XML_SPECIAL_CHARACTERS = /[&<>"']/g;

/**
 * Escapes a value for use in the text or a quoted attribute of an XML element, as the sitemap
 * protocol requires for its URLs.
 *
 * @param value - Text to escape. Missing or not a string, it counts as empty.
 * @returns The text with each of `&`, `<`, `>`, `"` and `'` written as its entity.
 *
 * @example
 * escapeXml('https://issoufi.fr/?a=1&b=2'); // 'https://issoufi.fr/?a=1&amp;b=2'
 */
export const escapeXml = (value?: unknown): string =>
  typeof value === 'string'
    ? value.replace(XML_SPECIAL_CHARACTERS, character => XML_ENTITIES[character])
    : '';

/**
 * Renders the `url` element of a page in a language: its URL, then an `xhtml:link` to each of its
 * translations, the page itself included (see {@link getPageAlternates}).
 */
const renderUrl = ({ page, language }: PageFile): string => {
  const location = getPageUrl({ path: page.path, language });
  const alternateLinks = getPageAlternates(page.path).map(
    ({ hreflang, href }) =>
      `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`,
  );

  return ['  <url>', `    <loc>${escapeXml(location)}</loc>`, ...alternateLinks, '  </url>'].join(
    '\n',
  );
};

/**
 * Renders `sitemap.xml`, the list of the URLs that search engines should index: every page of
 * `PAGES` in every language of `LANGUAGES` (see `getPageFiles`), each with the links to its
 * translations, as its HTML file has them. The not found pages, which are not indexed, are left
 * out. Used by the Vite plugin at build time.
 *
 * @returns The XML of the sitemap, ending with a line break.
 *
 * @example
 * renderSitemap();
 * // <?xml version="1.0" encoding="UTF-8"?>
 * // <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="…">
 * //   <url>
 * //     <loc>https://issoufi.fr/</loc>
 * //     <xhtml:link rel="alternate" hreflang="fr" href="https://issoufi.fr/" />
 * //     …
 */
export const renderSitemap = (): string =>
  [
    XML_DECLARATION,
    `<urlset xmlns="${SITEMAP_NAMESPACE}" xmlns:xhtml="${XHTML_NAMESPACE}">`,
    ...getPageFiles().map(renderUrl),
    '</urlset>',
    '',
  ].join('\n');
