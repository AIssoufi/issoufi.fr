import { GITHUB_PROFILE_URL, LINKEDIN_PROFILE_URL } from '../constants/profiles';
import { LANGUAGES } from '../i18n/constants';
import type { Language } from '../i18n/types';
import { EXPERIENCES_PAGE, getPageFiles, getPageUrl, HOME_PAGE, PROJECTS_PAGE } from './pages';
import {
  getStructuredData,
  PERSON_ID,
  renderStructuredDataScript,
  SCHEMA_ORG_CONTEXT,
  serializeStructuredData,
  type StructuredData,
  type WebPageNode,
} from './structuredData';

/** Opening tag of the script element of the structured data. */
const SCRIPT_START = '<script type="application/ld+json">';
const SCRIPT_END = '</script>';

/** Reads back the structured data written in a script element. */
const parseScript = (script: string) =>
  JSON.parse(script.slice(SCRIPT_START.length, -SCRIPT_END.length)) as StructuredData;

/** Finds the node of the page itself in structured data, the last one of its graph. */
const getPageNode = (data: StructuredData) => data['@graph'].slice(-1)[0] as WebPageNode;

/** Builds structured data around a page named with a text, as a translation could write it. */
const withPageName = (name: string): StructuredData => {
  const data = getStructuredData({ page: PROJECTS_PAGE });
  return { ...data, '@graph': [{ ...data['@graph'][0], name }] };
};

describe('getStructuredData', () => {
  it('declares the French site and the profile of its owner on the French home page', () => {
    expect(getStructuredData({ page: HOME_PAGE, language: 'fr' })).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': 'https://issoufi.fr/#website',
          url: 'https://issoufi.fr/',
          name: 'ADAM Issoufi',
          inLanguage: 'fr',
        },
        {
          '@type': 'ProfilePage',
          '@id': 'https://issoufi.fr/',
          url: 'https://issoufi.fr/',
          name: 'ADAM Issoufi - Développeur full-stack JavaScript',
          inLanguage: 'fr',
          isPartOf: { '@id': 'https://issoufi.fr/#website' },
          mainEntity: {
            '@type': 'Person',
            '@id': 'https://issoufi.fr/#person',
            name: 'ADAM Issoufi',
            jobTitle: 'Développeur full-stack JavaScript',
            url: 'https://issoufi.fr/',
            image: 'https://issoufi.fr/og-image.jpg',
            sameAs: ['https://github.com/AIssoufi', 'https://www.linkedin.com/in/issoufiadam'],
          },
        },
      ],
    });
  });

  it('declares the English site and the same person, in English, on the English home page', () => {
    expect(getStructuredData({ page: HOME_PAGE, language: 'en' })).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': 'https://issoufi.fr/en/#website',
          url: 'https://issoufi.fr/en/',
          name: 'ADAM Issoufi',
          inLanguage: 'en',
        },
        {
          '@type': 'ProfilePage',
          '@id': 'https://issoufi.fr/en/',
          url: 'https://issoufi.fr/en/',
          name: 'ADAM Issoufi - Full-stack JavaScript Developer',
          inLanguage: 'en',
          isPartOf: { '@id': 'https://issoufi.fr/en/#website' },
          mainEntity: {
            '@type': 'Person',
            '@id': 'https://issoufi.fr/#person',
            name: 'ADAM Issoufi',
            jobTitle: 'Full-stack JavaScript Developer',
            url: 'https://issoufi.fr/en/',
            image: 'https://issoufi.fr/og-image-en.jpg',
            sameAs: ['https://github.com/AIssoufi', 'https://www.linkedin.com/in/issoufiadam'],
          },
        },
      ],
    });
  });

  it('describes another page alone, about the owner referred to by their identifier', () => {
    expect(getStructuredData({ page: EXPERIENCES_PAGE, language: 'en' })).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://issoufi.fr/en/experiences',
          url: 'https://issoufi.fr/en/experiences',
          name: 'Experience - ADAM Issoufi',
          inLanguage: 'en',
          isPartOf: { '@id': 'https://issoufi.fr/en/#website' },
          about: { '@id': 'https://issoufi.fr/#person' },
        },
      ],
    });
  });

  it.each(getPageFiles())(
    'gives $fileName the vocabulary of schema.org and its canonical URL, in $language',
    ({ page, language }) => {
      const data = getStructuredData({ page, language });
      const pageNode = getPageNode(data);

      expect(data['@context']).toBe(SCHEMA_ORG_CONTEXT);
      expect(pageNode).toMatchObject({
        '@id': getPageUrl({ path: page.path, language }),
        url: getPageUrl({ path: page.path, language }),
        inLanguage: language,
      });
    },
  );

  it.each(LANGUAGES)('names the profiles that the header of the %s pages links to', language => {
    const profilePage = getPageNode(getStructuredData({ page: HOME_PAGE, language }));

    expect(profilePage).toHaveProperty('mainEntity.sameAs', [
      GITHUB_PROFILE_URL,
      LINKEDIN_PROFILE_URL,
    ]);
  });

  it('refers to the person that the home pages declare from every other page', () => {
    const declaredIds = LANGUAGES.map(
      language => getPageNode(getStructuredData({ page: HOME_PAGE, language })).mainEntity?.['@id'],
    );
    const referredIds = getPageFiles()
      .filter(({ page }) => page !== HOME_PAGE)
      .map(({ page, language }) => getPageNode(getStructuredData({ page, language })).about);

    expect(declaredIds).toEqual(LANGUAGES.map(() => PERSON_ID));
    expect(referredIds).toHaveLength(getPageFiles().length - LANGUAGES.length);
    referredIds.forEach(reference => expect(reference).toEqual({ '@id': PERSON_ID }));
  });

  describe('edge cases', () => {
    it('describes a page in the default language without a language', () => {
      expect(getStructuredData({ page: PROJECTS_PAGE })).toEqual(
        getStructuredData({ page: PROJECTS_PAGE, language: 'fr' }),
      );
    });

    it.each(['de', '', null, 42])('counts the language %j as the default language', language => {
      expect(
        getStructuredData({ page: HOME_PAGE, language: language as unknown as Language }),
      ).toEqual(getStructuredData({ page: HOME_PAGE, language: 'fr' }));
    });
  });
});

describe('serializeStructuredData', () => {
  it('writes the data as JSON on one line', () => {
    const data = getStructuredData({ page: HOME_PAGE });

    expect(serializeStructuredData(data)).not.toContain('\n');
    expect(JSON.parse(serializeStructuredData(data))).toEqual(data);
  });

  it('escapes a text that would end the script element, and keeps it once parsed', () => {
    const data = withPageName('</script><script>alert(1)</script>');
    const json = serializeStructuredData(data);

    expect(json).toContain(
      '"\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e"',
    );
    expect(json).not.toMatch(/[<>]/);
    expect(JSON.parse(json)).toEqual(data);
  });

  it('escapes an HTML comment and an ampersand', () => {
    const json = serializeStructuredData(withPageName('<!-- R&D -->'));

    expect(json).toContain('"\\u003c!-- R\\u0026D --\\u003e"');
    expect(json).not.toMatch(/[<>&]/);
  });

  it('keeps the characters of the translations as they are', () => {
    const json = serializeStructuredData(withPageName('Expériences d’ADAM\u00a0: 2024'));

    expect(json).toContain('"Expériences d’ADAM\u00a0: 2024"');
  });

  it('writes empty structured data', () => {
    expect(serializeStructuredData({ '@context': SCHEMA_ORG_CONTEXT, '@graph': [] })).toBe(
      '{"@context":"https://schema.org","@graph":[]}',
    );
  });
});

describe('renderStructuredDataScript', () => {
  it.each(getPageFiles())('holds the structured data of $fileName', ({ page, language }) => {
    const script = renderStructuredDataScript({ page, language });

    expect(script.startsWith(SCRIPT_START)).toBe(true);
    expect(script.endsWith(SCRIPT_END)).toBe(true);
    expect(script.split(SCRIPT_END)).toHaveLength(2);
    expect(parseScript(script)).toEqual(getStructuredData({ page, language }));
  });

  it('renders the default language without a language', () => {
    expect(renderStructuredDataScript({ page: HOME_PAGE })).toBe(
      renderStructuredDataScript({ page: HOME_PAGE, language: 'fr' }),
    );
  });
});
