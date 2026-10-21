import { isEntry, isFilled, toEntries, toText, toTexts } from './data.mjs';

describe('toText', () => {
  it.each(['', '  ', 'React'])('keeps the text %j', text => {
    expect(toText(text)).toBe(text);
  });

  it.each([undefined, null, 42, NaN, true, ['React'], { text: 'React' }])(
    'gives an empty text for %j',
    value => {
      expect(toText(value)).toBe('');
    },
  );
});

describe('isFilled', () => {
  it.each([
    ['React', true],
    [' a ', true],
    ['', false],
    ['  ', false],
    ['\n\t', false],
  ])('tells that %j is filled: %s', (text, expected) => {
    expect(isFilled(text)).toBe(expected);
  });
});

describe('isEntry', () => {
  it.each([{}, { name: 'Acme' }])('takes %j as an entry', value => {
    expect(isEntry(value)).toBe(true);
  });

  it.each([undefined, null, 42, 'Acme', [], [{ name: 'Acme' }]])(
    'does not take %j as an entry',
    value => {
      expect(isEntry(value)).toBe(false);
    },
  );
});

describe('toEntries', () => {
  it('keeps the objects of a list, in order', () => {
    expect(toEntries([{ id: 1 }, 'Acme', null, [], 42, { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it.each([undefined, null, 42, 'Acme', { id: 1 }])('gives no entry for %j', value => {
    expect(toEntries(value)).toEqual([]);
  });
});

describe('toTexts', () => {
  it('keeps the filled texts of a list, in order', () => {
    expect(toTexts(['React', '', '  ', 42, null, ['Vite'], 'TypeScript'])).toEqual([
      'React',
      'TypeScript',
    ]);
  });

  it.each([undefined, null, 42, 'React', { items: ['React'] }])('gives no text for %j', value => {
    expect(toTexts(value)).toEqual([]);
  });
});
