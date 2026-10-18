import { LANGUAGES } from '../i18n/constants';
import { getPageAlternates, getPageFiles, getPageUrl, PAGES, SITE_URL } from './pages';
import {
  escapeXml,
  renderSitemap,
  SITEMAP_NAMESPACE,
  SITEMAP_URL,
  XHTML_NAMESPACE,
} from './sitemap';

/** Longest URL that the sitemap protocol accepts, in characters. */
const MAX_URL_LENGTH = 2048;

/** Parses an XML document as browsers and search engines do. */
const parseXml = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml');

/** Tells whether the parser refused a document: it then returns a `parsererror` element. */
const hasParseError = (document: Document) =>
  document.getElementsByTagName('parsererror').length > 0;

/** Lists the `url` elements of a parsed sitemap. */
const getUrlElements = (document: Document) => [
  ...document.getElementsByTagNameNS(SITEMAP_NAMESPACE, 'url'),
];

/** Reads the `loc` of a `url` element of the sitemap. */
const getLocation = (url: Element) =>
  url.getElementsByTagNameNS(SITEMAP_NAMESPACE, 'loc')[0]?.textContent;

/** Lists the translations that a `url` element of the sitemap links to. */
const getAlternates = (url: Element) =>
  [...url.getElementsByTagNameNS(XHTML_NAMESPACE, 'link')].map(link => ({
    rel: link.getAttribute('rel'),
    hreflang: link.getAttribute('hreflang'),
    href: link.getAttribute('href'),
  }));

describe('escapeXml', () => {
  it.each([
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ["'", '&apos;'],
  ])('writes %s as %s', (character, entity) => {
    expect(escapeXml(character)).toBe(entity);
  });

  it('escapes every special character of a URL', () => {
    expect(escapeXml('https://issoufi.fr/?a=1&b="2"')).toBe(
      'https://issoufi.fr/?a=1&amp;b=&quot;2&quot;',
    );
  });

  it('escapes the ampersand of a text that looks escaped already, so it is read as written', () => {
    expect(escapeXml('&amp;')).toBe('&amp;amp;');
  });

  it('leaves a text without special characters as it is', () => {
    expect(escapeXml('https://issoufi.fr/en/projects')).toBe('https://issoufi.fr/en/projects');
  });

  it.each([undefined, null, 42, {}, ['&'], ''])('gives an empty text for %j', value => {
    expect(escapeXml(value)).toBe('');
  });
});

describe('renderSitemap', () => {
  const sitemap = renderSitemap();
  const document = parseXml(sitemap);
  const urls = getUrlElements(document);

  it('is well-formed XML, which the parser refuses when it is not', () => {
    expect(hasParseError(parseXml('<urlset><url></urlset>'))).toBe(true);
    expect(hasParseError(document)).toBe(false);
  });

  it('declares its encoding on its first line and ends with a line break', () => {
    expect(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
    expect(sitemap.endsWith('</urlset>\n')).toBe(true);
  });

  it('holds a urlset of the sitemap protocol', () => {
    expect(document.documentElement.localName).toBe('urlset');
    expect(document.documentElement.namespaceURI).toBe(SITEMAP_NAMESPACE);
  });

  it('lists every page in every language, once each', () => {
    const expectedUrls = getPageFiles().map(({ page, language }) =>
      getPageUrl({ path: page.path, language }),
    );

    expect(urls.map(getLocation)).toEqual(expectedUrls);
    expect(urls).toHaveLength(PAGES.length * LANGUAGES.length);
  });

  it('gives each URL a single location', () => {
    urls.forEach(url => {
      expect(url.getElementsByTagNameNS(SITEMAP_NAMESPACE, 'loc')).toHaveLength(1);
    });
  });

  it.each(getPageFiles())(
    'links $fileName to its translations, as its HTML file does',
    ({ page, language }) => {
      const url = urls.find(
        element => getLocation(element) === getPageUrl({ path: page.path, language }),
      );
      const expectedAlternates = getPageAlternates(page.path).map(alternate => ({
        rel: 'alternate',
        ...alternate,
      }));

      expect(url && getAlternates(url)).toEqual(expectedAlternates);
    },
  );

  it('lists each URL among its own translations, as search engines require', () => {
    urls.forEach(url => {
      const hrefs = getAlternates(url).map(({ href }) => href);

      expect(hrefs).toContain(getLocation(url));
    });
  });

  it('gives only absolute URLs of the site, within the length the protocol accepts', () => {
    const allUrls = urls.flatMap(url => [
      getLocation(url) ?? '',
      ...getAlternates(url).map(({ href }) => href ?? ''),
    ]);

    allUrls.forEach(url => {
      expect(url.startsWith(`${SITE_URL}/`)).toBe(true);
      expect(url.length).toBeLessThan(MAX_URL_LENGTH);
    });
  });
});

describe('SITEMAP_URL', () => {
  it('is served at the root of the site', () => {
    expect(SITEMAP_URL).toBe('https://issoufi.fr/sitemap.xml');
  });
});
