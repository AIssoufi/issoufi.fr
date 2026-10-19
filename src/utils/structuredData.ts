import {
  GITHUB_PROFILE_URL,
  LINKEDIN_PROFILE_URL,
} from '../App/Header/NavMenu/ProfileLinks/constants';
import { DEFAULT_LANGUAGE } from '../i18n/constants';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';
import type { Language, Translations } from '../i18n/types';
import { isLanguage } from '../i18n/utils';
import { getOgImageUrl, getPageUrl, HOME_PAGE, type Page, SITE_URL } from './pages';

/** Vocabulary of the structured data of the pages, the `@context` of each of them. */
export const SCHEMA_ORG_CONTEXT = 'https://schema.org';

/**
 * Media type of the script element that holds the structured data of a page: a data block, which
 * browsers do not run, so the Content Security Policy of the site, which refuses inline scripts,
 * leaves it alone.
 */
export const STRUCTURED_DATA_MEDIA_TYPE = 'application/ld+json';

/**
 * Identifier of the owner of the site in the structured data, the same in every language, since
 * the pages of both describe the same person: the home pages declare them, the other pages refer
 * to them.
 */
export const PERSON_ID = `${SITE_URL}/#person`;

/** End of the identifier of the site in a language, after the URL of its home page. */
const WEB_SITE_ID_SUFFIX = '#website';

/** Translations of each language, which name the site, its owner and each page. */
const TRANSLATIONS: Record<Language, Translations> = { fr, en };

/**
 * Characters that would end or change the script element holding a JSON text if written as they
 * are: `<` (`</script>`, `<!--`), `>` (`-->`) and `&`. JSON escapes them in its strings, the only
 * place where they can appear.
 */
const HTML_SENSITIVE_CHARACTER_PATTERN = /[<>&]/g;

/** Number of hexadecimal digits of a `\uXXXX` escape of JSON. */
const UNICODE_ESCAPE_DIGITS = 4;

/** Hexadecimal radix, in which a `\uXXXX` escape of JSON writes its code unit. */
const HEXADECIMAL_RADIX = 16;

/** Reference to a node of the structured data, declared in full on the same page or another one. */
export interface NodeReference {
  /** Identifier of the node, e.g. {@link PERSON_ID}. */
  '@id': string;
}

/** The site in one language, as a `WebSite` of schema.org, where search engines read its name. */
export interface WebSiteNode {
  /** Type of schema.org of the node. */
  '@type': 'WebSite';
  /** Identifier of the site in that language: the URL of its home page, then `#website`. */
  '@id': string;
  /** URL of its home page in that language, e.g. `https://issoufi.fr/en/`. */
  url: string;
  /** Name of the site, the `meta.siteName` translation. */
  name: string;
  /** Language of the site. */
  inLanguage: Language;
}

/** The owner of the site, as a `Person` of schema.org. */
export interface PersonNode {
  /** Type of schema.org of the node. */
  '@type': 'Person';
  /** Identifier of the person, {@link PERSON_ID}. */
  '@id': string;
  /** Name of the person, the `meta.ownerName` translation. */
  name: string;
  /** Job title, the one the home page shows (`home.title1`), in the language of the page. */
  jobTitle: string;
  /** URL of the home page in the language of the page. */
  url: string;
  /** URL of the link preview image of the language of the page (see {@link getOgImageUrl}). */
  image: string;
  /** Profiles of the person on other sites, the GitHub and LinkedIn ones of the header. */
  sameAs: string[];
}

/** A page of the site, as a `ProfilePage` of schema.org on the home page, a `WebPage` elsewhere. */
export interface WebPageNode {
  /** Type of schema.org of the node: `ProfilePage` on the home page, `WebPage` on the others. */
  '@type': 'ProfilePage' | 'WebPage';
  /** Identifier of the page, its canonical URL. */
  '@id': string;
  /** Canonical URL of the page, in its language. */
  url: string;
  /** Title of the page, its `meta` translation. */
  name: string;
  /** Language of the page. */
  inLanguage: Language;
  /** The site in the language of the page. */
  isPartOf: NodeReference;
  /** The owner of the site, in full: only on the home page, which is their profile. */
  mainEntity?: PersonNode;
  /** The owner of the site, by their identifier: on the other pages, which are about them. */
  about?: NodeReference;
}

/** Structured data of a page, its nodes in one graph. */
export interface StructuredData {
  /** Vocabulary of the data, {@link SCHEMA_ORG_CONTEXT}. */
  '@context': typeof SCHEMA_ORG_CONTEXT;
  /** The site then the page on the home page, the page alone on the others. */
  '@graph': (WebSiteNode | WebPageNode)[];
}

/** Parameters of {@link getStructuredData} and {@link renderStructuredDataScript}. */
interface GetStructuredDataParams {
  /** Page to describe. */
  page: Page;
  /**
   * Language of the page. A value that is not one of the `LANGUAGES` counts as the default
   * language. @default DEFAULT_LANGUAGE
   */
  language?: Language;
}

/**
 * Describes a page of the site and its owner for search engines, in the vocabulary of schema.org:
 * on the home page of each language, the site (`WebSite`, from which search engines read its
 * name) and the page as the profile of its owner (`ProfilePage`, whose `mainEntity` is a
 * `Person`), and on every other page, the page alone (`WebPage`), about the same person, referred
 * to by {@link PERSON_ID}. Every text and URL is the one of the language of the page.
 *
 * @example
 * getStructuredData({ page: PROJECTS_PAGE, language: 'en' });
 * // {
 * //   '@context': 'https://schema.org',
 * //   '@graph': [{
 * //     '@type': 'WebPage',
 * //     '@id': 'https://issoufi.fr/en/projects',
 * //     url: 'https://issoufi.fr/en/projects',
 * //     name: 'Projects - ADAM Issoufi',
 * //     inLanguage: 'en',
 * //     isPartOf: { '@id': 'https://issoufi.fr/en/#website' },
 * //     about: { '@id': 'https://issoufi.fr/#person' },
 * //   }],
 * // }
 */
export function getStructuredData({ page, language }: GetStructuredDataParams): StructuredData {
  const pageLanguage = isLanguage(language) ? language : DEFAULT_LANGUAGE;
  const { meta, home } = TRANSLATIONS[pageLanguage];
  const homeUrl = getPageUrl({ path: HOME_PAGE.path, language: pageLanguage });
  const url = getPageUrl({ path: page.path, language: pageLanguage });
  const webSiteId = `${homeUrl}${WEB_SITE_ID_SUFFIX}`;
  const isHomePage = page.path === HOME_PAGE.path;
  const webPage: WebPageNode = {
    '@type': 'WebPage',
    '@id': url,
    url,
    name: meta[page.meta].title,
    inLanguage: pageLanguage,
    isPartOf: { '@id': webSiteId },
  };

  if (!isHomePage) {
    return {
      '@context': SCHEMA_ORG_CONTEXT,
      '@graph': [{ ...webPage, about: { '@id': PERSON_ID } }],
    };
  }

  const webSite: WebSiteNode = {
    '@type': 'WebSite',
    '@id': webSiteId,
    url: homeUrl,
    name: meta.siteName,
    inLanguage: pageLanguage,
  };
  const person: PersonNode = {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: meta.ownerName,
    jobTitle: home.title1,
    url: homeUrl,
    image: getOgImageUrl(pageLanguage),
    sameAs: [GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL],
  };
  return {
    '@context': SCHEMA_ORG_CONTEXT,
    '@graph': [webSite, { ...webPage, '@type': 'ProfilePage', mainEntity: person }],
  };
}

/** Writes a character as the `\uXXXX` escape of JSON, e.g. `<` as `\u003c`. */
const toUnicodeEscape = (character: string) =>
  `\\u${character.charCodeAt(0).toString(HEXADECIMAL_RADIX).padStart(UNICODE_ESCAPE_DIGITS, '0')}`;

/**
 * Writes structured data as a JSON text that a script element of an HTML page can hold as it is:
 * on one line, with `<`, `>` and `&` escaped (`\u003c`, `\u003e`, `\u0026`), so that a text
 * such as `</script>` cannot end the element, and the JSON stays the same once parsed.
 *
 * @param data - Structured data of a page (see {@link getStructuredData}).
 *
 * @example
 * serializeStructuredData({ '@context': 'https://schema.org', '@graph': [] });
 * // '{"@context":"https://schema.org","@graph":[]}'
 */
export const serializeStructuredData = (data: StructuredData): string =>
  JSON.stringify(data).replace(HTML_SENSITIVE_CHARACTER_PATTERN, toUnicodeEscape);

/**
 * Renders the script element that declares the structured data of a page in its language (see
 * {@link getStructuredData}), for the head of its HTML file. Browsers do not run it: search
 * engines read it.
 *
 * @example
 * renderStructuredDataScript({ page: PROJECTS_PAGE, language: 'en' });
 * // '<script type="application/ld+json">{"@context":"https://schema.org",…}</script>'
 */
export const renderStructuredDataScript = ({ page, language }: GetStructuredDataParams): string => {
  const json = serializeStructuredData(getStructuredData({ page, language }));
  return `<script type="${STRUCTURED_DATA_MEDIA_TYPE}">${json}</script>`;
};
