import {
  formatKilobytes,
  formatPercent,
  isPositiveInteger,
  isPositiveNumber,
  toNonNegativeNumber,
} from './numbers.mjs';

describe('toNonNegativeNumber', () => {
  it.each([
    [1, 1],
    [224_940, 224_940],
    [0.5, 0.5],
  ])('keeps the positive number %s', (value, expected) => {
    expect(toNonNegativeNumber(value)).toBe(expected);
  });

  it.each([0, -0, -1, NaN, Infinity, -Infinity, undefined, null, '42', {}, []])(
    'gives 0 for %s',
    value => {
      expect(toNonNegativeNumber(value)).toBe(0);
    },
  );
});

describe('isPositiveNumber', () => {
  it.each([1, 0.5, 500_000, Number.MAX_SAFE_INTEGER])('accepts %s', value => {
    expect(isPositiveNumber(value)).toBe(true);
  });

  it.each([0, -0, -1, NaN, Infinity, -Infinity, undefined, null, '500000', {}, []])(
    'rejects %s',
    value => {
      expect(isPositiveNumber(value)).toBe(false);
    },
  );
});

describe('formatKilobytes', () => {
  it.each([
    [224_940, '224.9 kB'],
    [1000, '1.0 kB'],
    [999, '1.0 kB'],
    [1, '0.0 kB'],
    [0, '0.0 kB'],
  ])('formats %s bytes as %s', (bytes, expected) => {
    expect(formatKilobytes(bytes)).toBe(expected);
  });

  it.each([-5, NaN, Infinity, undefined, null, '1000'])('shows the invalid size %s as 0', bytes => {
    expect(formatKilobytes(bytes)).toBe('0.0 kB');
  });
});

describe('formatPercent', () => {
  it.each([
    [97.66, '97.7%'],
    [100, '100.0%'],
    [0, '0.0%'],
    [-1.25, '-1.3%'],
  ])('formats %s as %s', (percent, expected) => {
    expect(formatPercent(percent)).toBe(expected);
  });

  it.each([NaN, Infinity, undefined, null, 'Unknown', '97.7'])('shows %s as n/a', percent => {
    expect(formatPercent(percent)).toBe('n/a');
  });
});

describe('isPositiveInteger', () => {
  it.each([1, 162, Number.MAX_SAFE_INTEGER])('accepts %s', value => {
    expect(isPositiveInteger(value)).toBe(true);
  });

  it.each([
    0,
    -0,
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    NaN,
    Infinity,
    undefined,
    null,
    '162',
    {},
    [],
  ])('rejects %s', value => {
    expect(isPositiveInteger(value)).toBe(false);
  });
});
