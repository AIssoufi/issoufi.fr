import { getEntries } from './testUtils';

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
