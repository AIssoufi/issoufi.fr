import { getEntries, getMissingKeys } from './testUtils';

describe('getEntries', () => {
  it('finds every nested translation, with its dotted key', () => {
    expect(getEntries({ value: { nav: { home: 'Accueil' }, title: 'Titre' } })).toEqual([
      ['nav.home', 'Accueil'],
      ['title', 'Titre'],
    ]);
  });

  it.each([
    ['a missing value', undefined],
    ['null', null],
    ['a number', 42],
    ['an empty object', {}],
  ])('finds no translation in %s', (_, value) => {
    expect(getEntries({ value })).toEqual([]);
  });

  it('uses the key of a translation at the root', () => {
    expect(getEntries({ value: 'Accueil', key: 'nav.home' })).toEqual([['nav.home', 'Accueil']]);
  });
});

describe('getMissingKeys', () => {
  const reference = { nav: { home: 'Accueil', projects: 'Projets' }, title: 'Titre' };

  it('finds no missing key in translations with the same keys', () => {
    const translations = { title: 'Title', nav: { projects: 'Projects', home: 'Home' } };

    expect(getMissingKeys({ translations, reference })).toEqual([]);
  });

  it('names the missing keys, nested ones with their dotted path', () => {
    const translations = { nav: { projects: 'Projects' } };

    expect(getMissingKeys({ translations, reference })).toEqual(['nav.home', 'title']);
  });

  it('ignores the keys that the reference does not have', () => {
    const translations = {
      nav: { home: 'Home', projects: 'Projects', extra: 'Extra' },
      title: 'Title',
    };

    expect(getMissingKeys({ translations, reference })).toEqual([]);
  });

  it.each([
    ['an object', { nested: 'Titre' }],
    ['a number', 42],
    ['null', null],
    ['a missing value', undefined],
  ])('counts a key holding %s instead of a text as missing', (_, title) => {
    const translations = { nav: { home: 'Home', projects: 'Projects' }, title };

    expect(getMissingKeys({ translations, reference })).toEqual(['title']);
  });

  it.each([
    ['missing translations', undefined],
    ['null translations', null],
    ['a text', 'Accueil'],
    ['an empty object', {}],
  ])('names every key of the reference for %s', (_, translations) => {
    expect(getMissingKeys({ translations, reference })).toEqual([
      'nav.home',
      'nav.projects',
      'title',
    ]);
  });

  it.each([
    ['a missing reference', undefined],
    ['a null reference', null],
    ['a text reference', 'Titre'],
    ['a number reference', 42],
    ['an empty reference', {}],
  ])('finds no missing key against %s', (_, nonNestedReference) => {
    const translations = { title: 'Title' };

    expect(getMissingKeys({ translations, reference: nonNestedReference })).toEqual([]);
  });
});
