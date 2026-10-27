import { CV_SOURCES } from '../testUtils.js';
import { buildCvContents } from './languages.mjs';

describe('buildCvContents', () => {
  it('builds one CV per language of the site, in its order', async () => {
    const contents = await buildCvContents(CV_SOURCES);

    expect(contents.map(({ language }) => language)).toEqual(['fr', 'en']);
  });

  it('writes each CV with the texts of its language', async () => {
    const [french, english] = await buildCvContents(CV_SOURCES);

    expect(french.jobTitle).toBe('Développeur Front-End Senior');
    expect(english.jobTitle).toBe('Senior Front-End Developer');
    expect(french.experiences.title).toBe('Expériences');
    expect(english.experiences.title).toBe('Experience');
    expect(english.experiences.items[0].details).toBe('Permanent\u00a0· Paris\u00a0(75)');
  });

  it('links each CV to the home page of its language', async () => {
    const [french, english] = await buildCvContents(CV_SOURCES);

    expect(french.profiles[0]).toEqual({
      text: 'issoufi.fr',
      url: 'https://issoufi.fr/',
      icon: 'site',
    });
    expect(english.profiles[0]).toEqual({
      text: 'issoufi.fr',
      url: 'https://issoufi.fr/en/',
      icon: 'site',
    });
  });

  it('writes the French text of a key that English lacks, as the site does', async () => {
    const translations = { ...CV_SOURCES.translations, en: { ...CV_SOURCES.translations.en } };
    translations.en.exp = { ...translations.en.exp, pageTitle: undefined };

    const [, english] = await buildCvContents({ ...CV_SOURCES, translations });

    expect(english.experiences.title).toBe('Expériences');
  });

  it('builds no CV when the site has no language', async () => {
    expect(await buildCvContents({ ...CV_SOURCES, languages: [] })).toEqual([]);
  });

  it.each([undefined, null, {}, { experiences: 'Sewan' }])(
    'lists no experience for the data %j',
    async experiences => {
      const [french] = await buildCvContents({ ...CV_SOURCES, experiences });

      expect(french.experiences.items).toEqual([]);
    },
  );
});
