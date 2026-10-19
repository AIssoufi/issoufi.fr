import { isNonBlankString, listUniqueNonBlankStrings } from './strings.ts';

describe('isNonBlankString', () => {
  it.each(['/home.webp', 'a', ' padded ', '\tx\n'])('is true for %j', value => {
    expect(isNonBlankString(value)).toBe(true);
  });

  it.each(['', ' ', ' \t\n\r'])('is false for the blank string %j', value => {
    expect(isNonBlankString(value)).toBe(false);
  });

  it.each([undefined, null, 0, 42, NaN, true, {}, ['/home.webp'], () => 'a'])(
    'is false for %j, which is not a string',
    value => {
      expect(isNonBlankString(value)).toBe(false);
    },
  );
});

describe('listUniqueNonBlankStrings', () => {
  it('keeps the names in order', () => {
    expect(listUniqueNonBlankStrings(['React.js', 'TypeScript', 'Vite'])).toEqual([
      'React.js',
      'TypeScript',
      'Vite',
    ]);
  });

  it('keeps each name once, so the keys of their items stay unique', () => {
    expect(listUniqueNonBlankStrings(['React.js', 'Vite', 'React.js'])).toEqual([
      'React.js',
      'Vite',
    ]);
  });

  it('skips the entries that are not names', () => {
    expect(
      listUniqueNonBlankStrings([
        'React.js',
        '',
        '   ',
        42,
        null,
        undefined,
        { name: 'Vite' },
        ['Vite'],
      ]),
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
  ])('lists no name for %s', (_case, values) => {
    expect(listUniqueNonBlankStrings(values)).toEqual([]);
  });
});
