import { listTechnologyNames } from './technologies';

describe('listTechnologyNames', () => {
  it('keeps the names in order', () => {
    expect(listTechnologyNames(['React.js', 'TypeScript', 'Vite'])).toEqual([
      'React.js',
      'TypeScript',
      'Vite',
    ]);
  });

  it('keeps each name once, so the keys of their items stay unique', () => {
    expect(listTechnologyNames(['React.js', 'Vite', 'React.js'])).toEqual(['React.js', 'Vite']);
  });

  it('skips the entries that are not names', () => {
    expect(
      listTechnologyNames(['React.js', '', '   ', 42, null, undefined, { name: 'Vite' }, ['Vite']]),
    ).toEqual(['React.js']);
  });

  it.each([
    ['an empty list', []],
    ['a name written without its brackets', 'React.js'],
    ['an empty string', ''],
    ['an object', { 0: 'React.js', length: 1 }],
    ['a number', 3],
    ['null', null],
    ['nothing', undefined],
  ])('lists no name for %s', (_case, technologies) => {
    expect(listTechnologyNames(technologies)).toEqual([]);
  });
});
