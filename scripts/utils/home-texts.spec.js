import { LANGUAGES } from '../../src/i18n/constants';
import { en } from '../../src/i18n/en';
import { fr } from '../../src/i18n/fr';
import { SITE_URL } from '../../src/utils/pages';
import { TRANSLATION_MODULES } from './constants.mjs';
import { findMissingTexts, getAuthorName, getHomeTexts } from './home-texts.mjs';

describe('getAuthorName', () => {
  it('reads the name before the job title', () => {
    expect(
      getAuthorName({
        pageTitle: 'ADAM Issoufi - Développeur full-stack JavaScript',
        jobTitle: 'Développeur full-stack JavaScript',
      }),
    ).toBe('ADAM Issoufi');
  });

  it('reads the name in the French title of the home page', () => {
    expect(getAuthorName({ pageTitle: fr.meta.home.title, jobTitle: fr.home.title1 })).toBe(
      'ADAM Issoufi',
    );
  });

  it('reads the name in the English title of the home page', () => {
    expect(getAuthorName({ pageTitle: en.meta.home.title, jobTitle: en.home.title1 })).toBe(
      'ADAM Issoufi',
    );
  });

  it('removes the spaces around the name', () => {
    expect(getAuthorName({ pageTitle: '  ADAM Issoufi  - Dev', jobTitle: 'Dev' })).toBe(
      'ADAM Issoufi',
    );
  });

  it.each([
    ['another job title', 'ADAM Issoufi - Développeur', 'Designer'],
    ['the job title first', 'Développeur - ADAM Issoufi', 'Développeur'],
    ['no separator', 'ADAM Issoufi Développeur', 'Développeur'],
    ['an empty job title', 'ADAM Issoufi - ', ''],
    ['an empty title', '', 'Développeur'],
  ])('gives no name for %s', (_, pageTitle, jobTitle) => {
    expect(getAuthorName({ pageTitle, jobTitle })).toBe('');
  });

  it.each([
    [undefined, 'Développeur'],
    [null, 'Développeur'],
    [42, 'Développeur'],
    ['ADAM Issoufi - Développeur', undefined],
    ['ADAM Issoufi - Développeur', {}],
  ])('gives no name for the title %j and the job title %j', (pageTitle, jobTitle) => {
    expect(getAuthorName({ pageTitle, jobTitle })).toBe('');
  });
});

describe('getHomeTexts', () => {
  it('reads the texts of the home page in the French translations', () => {
    expect(getHomeTexts({ translations: fr, siteUrl: SITE_URL })).toEqual({
      logo: 'AI',
      name: 'ADAM Issoufi',
      jobTitle: 'Développeur full-stack JavaScript',
      passion: [
        { text: 'passionné par l’', isHighlighted: false },
        { text: 'UX', isHighlighted: true },
        { text: ' et l’', isHighlighted: false },
        { text: 'UI', isHighlighted: true },
        { text: ' Design', isHighlighted: false },
      ],
      subtitle: 'Je vous aide à développer vos applications web',
      site: 'issoufi.fr',
    });
  });

  it('reads the texts of the home page in the English translations', () => {
    expect(getHomeTexts({ translations: en, siteUrl: SITE_URL })).toEqual({
      logo: 'AI',
      name: 'ADAM Issoufi',
      jobTitle: 'Full-stack JavaScript Developer',
      passion: [
        { text: 'passionate about ', isHighlighted: false },
        { text: 'UX', isHighlighted: true },
        { text: ' and ', isHighlighted: false },
        { text: 'UI', isHighlighted: true },
        { text: ' Design', isHighlighted: false },
      ],
      subtitle: 'I help you build web applications',
      site: 'issoufi.fr',
    });
  });

  it.each([
    ['https://issoufi.fr/', 'issoufi.fr'],
    ['https://www.issoufi.fr/projects', 'www.issoufi.fr'],
    ['http://localhost:4173', 'localhost:4173'],
  ])('reads the domain of %s', (siteUrl, expected) => {
    expect(getHomeTexts({ translations: fr, siteUrl }).site).toBe(expected);
  });

  it.each(['issoufi.fr', '', undefined, null, 42])('gives no domain for %j', siteUrl => {
    expect(getHomeTexts({ translations: fr, siteUrl }).site).toBe('');
  });

  it.each([undefined, null, {}, 'fr', { home: null, meta: 42 }])(
    'gives empty texts, but the logo and the skills, for the translations %j',
    translations => {
      const texts = getHomeTexts({ translations, siteUrl: SITE_URL });

      expect(texts).toMatchObject({ logo: 'AI', name: '', jobTitle: '', subtitle: '' });
      expect(texts.passion.map(({ text }) => text)).toEqual(['', 'UX', '', 'UI', '']);
    },
  );

  it('gives an empty text for a translation that is not a string', () => {
    const translations = { ...fr, home: { ...fr.home, subtitle: 42, title2Mid: null } };
    const texts = getHomeTexts({ translations, siteUrl: SITE_URL });

    expect(texts.subtitle).toBe('');
    expect(texts.passion[2].text).toBe('');
  });
});

describe('findMissingTexts', () => {
  const texts = getHomeTexts({ translations: fr, siteUrl: SITE_URL });

  it.each([
    ['French', fr],
    ['English', en],
  ])('finds none in the %s translations', (_, translations) => {
    expect(findMissingTexts(getHomeTexts({ translations, siteUrl: SITE_URL }))).toEqual([]);
  });

  it.each([
    ['empty', ''],
    ['blank', '   '],
  ])('reports a text that is %s', (_, subtitle) => {
    expect(findMissingTexts({ ...texts, subtitle })).toEqual(['subtitle']);
  });

  it('reports every missing text, in order', () => {
    expect(findMissingTexts({ ...texts, name: '', site: '' })).toEqual(['name', 'site']);
  });

  it('reports the line about design when one of its pieces is empty', () => {
    const passion = texts.passion.map((segment, index) =>
      index === 4 ? { ...segment, text: '' } : segment,
    );

    expect(findMissingTexts({ ...texts, passion })).toEqual(['passion']);
  });

  it('keeps the spaces that start a piece of the line about design', () => {
    expect(texts.passion[2].text).toBe(' et l’');
    expect(findMissingTexts(texts)).not.toContain('passion');
  });

  it('reports every text of empty translations', () => {
    const emptyTexts = getHomeTexts({ translations: {}, siteUrl: '' });

    expect(findMissingTexts(emptyTexts)).toEqual([
      'name',
      'jobTitle',
      'subtitle',
      'site',
      'passion',
    ]);
  });
});

describe('TRANSLATION_MODULES', () => {
  /** Sorts a list of language codes, so lists in another order compare equal. */
  const sortLanguages = languages => [...languages].sort();

  it('names a module for every language of the site', () => {
    expect(sortLanguages(Object.keys(TRANSLATION_MODULES))).toEqual(sortLanguages(LANGUAGES));
  });

  it.each(Object.entries(TRANSLATION_MODULES))(
    'reads every text of the home page in the %s module, under the code of its language',
    async (language, id) => {
      const module = await import(/* @vite-ignore */ `../..${id}`);
      const texts = getHomeTexts({ translations: module[language], siteUrl: SITE_URL });

      expect(findMissingTexts(texts)).toEqual([]);
    },
  );
});
