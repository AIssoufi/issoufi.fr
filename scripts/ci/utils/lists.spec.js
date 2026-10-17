import { toList } from './lists.mjs';

describe('toList', () => {
  it.each([[[]], [['index.html', '404.html']], [[null, 42]]])('keeps the list %o as is', list => {
    expect(toList(list)).toBe(list);
  });

  it.each([undefined, null, '', 'index.html', 42, NaN, {}, { length: 2 }, new Set(['a'])])(
    'gives an empty list for %o',
    value => {
      expect(toList(value)).toEqual([]);
    },
  );
});
