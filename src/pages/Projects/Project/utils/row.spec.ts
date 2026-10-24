import { countWholeCards } from './row.ts';

describe('countWholeCards', () => {
  it.each([
    // One card between the page gutters, the next one starts in the right gutter
    [
      'a phone 375 px wide',
      { rowWidth: 375, firstCardStart: 24, cardWidth: 327, cardPitch: 337 },
      1,
    ],
    // Two columns, the third card starts in the right gutter
    [
      'a tablet 768 px wide',
      { rowWidth: 768, firstCardStart: 24, cardWidth: 355, cardPitch: 365 },
      2,
    ],
    // Two columns of the desktop layout, the third card out of view on the right
    [
      'a tablet 800 px wide',
      { rowWidth: 696, firstCardStart: 5, cardWidth: 338, cardPitch: 348 },
      2,
    ],
    // Cards narrower than the row, the third one cut by its edge
    ['a row that scrolls', { rowWidth: 696, firstCardStart: 5, cardWidth: 260, cardPitch: 270 }, 2],
    [
      'a laptop 1440 px wide',
      { rowWidth: 1336, firstCardStart: 5, cardWidth: 435.33, cardPitch: 445.33 },
      3,
    ],
  ])('counts the cards that the row shows whole on %s', (_screen, measures, expected) => {
    expect(countWholeCards(measures)).toBe(expected);
  });

  it('counts the cards that fit, more than a row of three holds', () => {
    expect(
      countWholeCards({ rowWidth: 1000, firstCardStart: 0, cardWidth: 100, cardPitch: 110 }),
    ).toBe(9);
  });

  it.each([
    ['ends on the edge of the row', 351, {}, 1],
    ['passes the edge by less than the rounding of the row width', 351.5, {}, 1],
    ['passes the edge by more than the rounding', 352.5, {}, 0],
    ['passes the edge with no tolerance', 351.5, { tolerancePx: 0 }, 0],
    ['passes the edge with a negative tolerance, counted as none', 351.5, { tolerancePx: -5 }, 0],
    ['passes the edge with a tolerance that is NaN', 351.5, { tolerancePx: Number.NaN }, 0],
  ])('counts a card that %s', (_case, cardWidth, options, expected) => {
    expect(
      countWholeCards({ rowWidth: 375, firstCardStart: 24, cardWidth, cardPitch: 400, ...options }),
    ).toBe(expected);
  });

  it('counts no card when even the first one is wider than the row', () => {
    expect(
      countWholeCards({ rowWidth: 280, firstCardStart: 5, cardWidth: 300, cardPitch: 310 }),
    ).toBe(0);
  });

  const MEASURES = { rowWidth: 375, firstCardStart: 24, cardWidth: 327, cardPitch: 337 };

  it.each([
    ['no measures', undefined],
    ['empty measures', {}],
    ['a row of no width, as nothing is laid out in jsdom', { ...MEASURES, rowWidth: 0 }],
    ['cards of no width', { ...MEASURES, cardWidth: 0, cardPitch: 0 }],
    ['a card width that is NaN', { ...MEASURES, cardWidth: Number.NaN }],
    ['a negative pitch', { ...MEASURES, cardPitch: -337 }],
    ['an infinite row width', { ...MEASURES, rowWidth: Number.POSITIVE_INFINITY }],
    ['a missing card width', { ...MEASURES, cardWidth: undefined }],
    ['a negative start', { ...MEASURES, firstCardStart: -1 }],
    ['a start that is NaN', { ...MEASURES, firstCardStart: Number.NaN }],
    ['a start that is a string', { ...MEASURES, firstCardStart: '24' as unknown as number }],
  ])('cannot count with %s', (_case, measures) => {
    expect(countWholeCards(measures)).toBeNull();
  });

  it('counts from a first card at the left edge of the row', () => {
    expect(countWholeCards({ ...MEASURES, firstCardStart: 0 })).toBe(1);
  });
});
