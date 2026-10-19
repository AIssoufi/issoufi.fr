import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  OPEN_GRAPH_LOCALES,
  TRANSLATIONS,
} from '../i18n/constants.ts';
import type { Language, Translations } from '../i18n/types.ts';
import {
  getOgImageUrl,
  getPageAlternates,
  getPageUrl,
  type Page,
  type PageAlternate,
} from './pages.ts';
import { isNonBlankString } from './strings.ts';
import { renderStructuredDataScript } from './structuredData.ts';
import { getWebManifestUrl } from './webManifest.ts';

/** Escapes a value for use inside a double-quoted HTML attribute or a text node. */
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Key of a page's title and description in the `meta` translations: every key but those that all
 * pages share, `ogImageAlt`, the description of the link preview image, `noScript`, the message
 * shown without JavaScript, `siteName` and `ownerName`, the names of the site and of its owner,
 * and `webApp`, the texts of the web app manifest.
 */
type PageMetaKey = Exclude<
  keyof Translations['meta'],
  'ogImageAlt' | 'noScript' | 'siteName' | 'ownerName' | 'webApp'
>;

/** A `%PAGE_*%` placeholder of `index.html`. Its first group captures its name. */
const PLACEHOLDER_PATTERN = /%(PAGE_[A-Z_]+)%/g;

/** Parameters of {@link fillPlaceholders}. */
interface FillPlaceholdersParams {
  /** HTML containing the `%PAGE_*%` placeholders. */
  template: string;
  /** Translation key of the title and description to inject. */
  meta: PageMetaKey;
  /** Language of the page, whose translations, code and Open Graph locale are injected. */
  language: Language;
  /** Absolute URL injected as the canonical and `og:url`. */
  url: string;
  /** Years of experience, replacing `{{years}}` in the description. */
  years: number;
}

/**
 * Replaces every `%PAGE_*%` placeholder with the metadata of a page in a language, HTML-escaped:
 * its language code (`<html lang>`), its Open Graph locale, the name of the site, its title, its
 * description, its URL, the URL and description of the link preview image of its language, and the
 * message shown without JavaScript. An unknown placeholder is left as it is.
 */
function fillPlaceholders({ template, meta, language, url, years }: FillPlaceholdersParams) {
  const translations = TRANSLATIONS[language].meta;
  const { title, description } = translations[meta];
  const values: Record<string, string> = {
    PAGE_LANGUAGE: language,
    PAGE_LOCALE: OPEN_GRAPH_LOCALES[language],
    PAGE_SITE_NAME: translations.siteName,
    PAGE_TITLE: title,
    PAGE_DESCRIPTION: description.replace(/{{years}}/g, String(years)),
    PAGE_URL: url,
    PAGE_IMAGE_URL: getOgImageUrl(language),
    PAGE_IMAGE_ALT: translations.ogImageAlt,
    PAGE_NOSCRIPT: translations.noScript,
  };

  return template.replace(PLACEHOLDER_PATTERN, (placeholder, key: string) =>
    key in values ? escapeHtml(values[key]) : placeholder,
  );
}

const HEAD_END_TAG = '</head>';

/** Parameters of {@link addToHead}. */
interface AddToHeadParams {
  /** HTML of a page. */
  html: string;
  /** Tags to add, already escaped. */
  tags: string[];
}

/**
 * Adds tags at the end of the head of a page, each on its own line, indented as the other tags of
 * the head (`</head>` is indented by two spaces). Adds nothing to a page without a head.
 */
const addToHead = ({ html, tags }: AddToHeadParams) =>
  html.replace(HEAD_END_TAG, `${tags.map(tag => `  ${tag}\n  `).join('')}${HEAD_END_TAG}`);

/** Renders the `alternate` link to a translation of a page. */
const renderAlternateLink = ({ hreflang, href }: PageAlternate) =>
  `<link rel="alternate" hreflang="${hreflang}" href="${escapeHtml(href)}" />`;

/** Parameters of {@link renderAlternateTags}. */
interface RenderAlternateTagsParams {
  /** Path of the page in the default language, e.g. `/projects`. */
  path: string;
  /** Language of the page that holds the tags. */
  language: Language;
}

/**
 * Renders the tags that point to the translations of a page: an `alternate` link per translation
 * (see {@link getPageAlternates}), which search engines use to show each visitor their language,
 * then an `og:locale:alternate` tag per other language, for link previews.
 */
const renderAlternateTags = ({ path, language }: RenderAlternateTagsParams): string[] => {
  const alternateLinks = getPageAlternates(path).map(renderAlternateLink);
  const localeTags = LANGUAGES.filter(other => other !== language).map(
    other => `<meta property="og:locale:alternate" content="${OPEN_GRAPH_LOCALES[other]}" />`,
  );

  return [...alternateLinks, ...localeTags];
};

/**
 * Renders the link to the web app manifest of a language (see {@link getWebManifestUrl}), so a
 * page installs as the site in its own language, opening on the home page of that language.
 */
const renderManifestLink = (language: Language) =>
  `<link rel="manifest" href="${escapeHtml(getWebManifestUrl(language))}" />`;

/** Parameters of {@link renderPageHtml}. */
interface RenderPageHtmlParams {
  /** Content of `index.html`, with its placeholders. */
  template: string;
  /** Page whose metadata to inject. */
  page: Page;
  /** Language of the page. @default DEFAULT_LANGUAGE */
  language?: Language;
  /** Years of experience, replacing `{{years}}` in the description. */
  years: number;
}

/**
 * Fills the `%PAGE_*%` placeholders of `index.html` with the metadata of a page in a language
 * (see {@link fillPlaceholders}), its URL in that language as the canonical URL, and adds to its
 * head the links to its translations (see {@link renderAlternateTags}) and to the web app manifest
 * of its language (see {@link renderManifestLink}), then its structured data, which describes the
 * page, the site and its owner to search engines (see {@link renderStructuredDataScript}). Used by
 * the Vite plugin at build time.
 *
 * @returns The HTML with every placeholder replaced and HTML-escaped.
 */
export function renderPageHtml({
  template,
  page,
  language = DEFAULT_LANGUAGE,
  years,
}: RenderPageHtmlParams): string {
  const url = getPageUrl({ path: page.path, language });
  const html = fillPlaceholders({ template, meta: page.meta, language, url, years });
  const tags = [
    ...renderAlternateTags({ path: page.path, language }),
    renderManifestLink(language),
    renderStructuredDataScript({ page, language }),
  ];
  return addToHead({ html, tags });
}

const CANONICAL_TAG = /<link\s+rel="canonical"[^>]*>\s*/;
const OG_URL_TAG = /<meta\s+property="og:url"[^>]*>\s*/;
const NO_INDEX_TAG = '<meta name="robots" content="noindex" />';

/** Parameters of {@link renderNotFoundHtml}. */
interface RenderNotFoundHtmlParams {
  /** Content of `index.html`, with its placeholders. */
  template: string;
  /** Language of the page. @default DEFAULT_LANGUAGE */
  language?: Language;
  /** Years of experience, in case the not found description uses `{{years}}`. */
  years: number;
}

/**
 * Builds a not found page from the `index.html` template: the "page not found" title and
 * description in its language, no canonical URL, `og:url`, translations or structured data (the
 * page has no address of its own), a `noindex` robots tag, and the link to the web app manifest
 * of its language. The app loads normally and shows its NotFound page at the requested URL.
 *
 * @returns The HTML of the not found page, with every placeholder replaced.
 */
export function renderNotFoundHtml({
  template,
  language = DEFAULT_LANGUAGE,
  years,
}: RenderNotFoundHtmlParams): string {
  const html = fillPlaceholders({ template, meta: 'notFound', language, url: '', years })
    .replace(CANONICAL_TAG, '')
    .replace(OG_URL_TAG, '');
  return addToHead({ html, tags: [NO_INDEX_TAG, renderManifestLink(language)] });
}

/** Parameters of {@link addModulePreload}. */
interface AddModulePreloadParams {
  /** HTML of a generated page. Missing or not a string, it counts as empty. */
  html?: string;
  /**
   * URL of the script to preload, e.g. `/assets/Projects-1a2b3c.js`. Missing, empty or blank,
   * no link is added.
   */
  href?: string;
}

/**
 * Adds a `modulepreload` link to a script in the head of a generated page, so that on a direct
 * visit the browser downloads the chunk of a lazily loaded page at the same time as the app,
 * instead of once the app has run. Used by the Vite plugin at build time.
 *
 * @returns The HTML with the link, HTML-escaped, just before `</head>`, or unchanged when there
 * is no URL or no head.
 *
 * @example
 * addModulePreload({ html: '<head>\n  </head>', href: '/assets/P-1.js' });
 * // '<head>\n    <link rel="modulepreload" crossorigin href="/assets/P-1.js" />\n  </head>'
 */
export function addModulePreload({ html, href }: AddModulePreloadParams = {}): string {
  const page = typeof html === 'string' ? html : '';
  const canAddLink = isNonBlankString(href) && page.includes(HEAD_END_TAG);
  if (!canAddLink) return page;

  const link = `<link rel="modulepreload" crossorigin href="${escapeHtml(href)}" />`;
  return addToHead({ html: page, tags: [link] });
}
