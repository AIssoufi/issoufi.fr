import {
  createInitialLikes,
  getCardTilt,
  getNextPageStart,
  getPreviousPageStart,
  toggleLike,
} from './utils';

describe('getNextPageStart', () => {
  it.each([
    [0, 4, 3],
    [3, 4, 3],
    [0, 5, 3],
    [3, 5, 3],
    [0, 7, 3],
    [3, 7, 6],
    [6, 7, 6],
  ])('goes from %i to %i with %i cards', (currentStart, total, expected) => {
    expect(getNextPageStart({ currentStart, total, pageSize: 3 })).toBe(expected);
  });

  it.each([
    ['3 cards or fewer', { currentStart: 0, total: 3, pageSize: 3 }],
    ['no card', { currentStart: 0, total: 0, pageSize: 3 }],
    ['an empty page size', { currentStart: 0, total: 5, pageSize: 0 }],
  ])('stays on the first page with %s', (_, params) => {
    expect(getNextPageStart(params)).toBe(0);
  });
});

describe('getPreviousPageStart', () => {
  it.each([
    [6, 3],
    [3, 0],
    [0, 0],
    [1, 0],
  ])('goes from %i to %i', (currentStart, expected) => {
    expect(getPreviousPageStart({ currentStart, pageSize: 3 })).toBe(expected);
  });
});

describe('getCardTilt', () => {
  const rect = { left: 100, top: 100, width: 200, height: 100 };

  it('does not tilt at the center', () => {
    const tilt = getCardTilt({ pointer: { x: 200, y: 150 }, rect, maxTilt: 6 });
    expect(tilt.rotateX).toBeCloseTo(0);
    expect(tilt.rotateY).toBeCloseTo(0);
    expect(tilt).toMatchObject({ x: 100, y: 50 });
  });

  it('tilts by the maximum at the corners', () => {
    expect(getCardTilt({ pointer: { x: 300, y: 100 }, rect, maxTilt: 6 })).toEqual({
      rotateX: 6,
      rotateY: 6,
      x: 200,
      y: 0,
    });
  });

  it('does not tilt an empty card instead of returning NaN', () => {
    const empty = { left: 0, top: 0, width: 0, height: 0 };
    expect(getCardTilt({ pointer: { x: 5, y: 5 }, rect: empty, maxTilt: 6 })).toEqual({
      rotateX: 0,
      rotateY: 0,
      x: 5,
      y: 5,
    });
  });
});

describe('createInitialLikes', () => {
  it('indexes the likes by project id', () => {
    const projects = [
      { id: 1, likeCount: 2, isLikedByOwnUser: true },
      { id: 7, likeCount: 0, isLikedByOwnUser: false },
    ];
    expect(createInitialLikes(projects)).toEqual({
      1: { count: 2, liked: true },
      7: { count: 0, liked: false },
    });
  });

  it('returns an empty state without projects', () => {
    expect(createInitialLikes([])).toEqual({});
  });
});

describe('toggleLike', () => {
  it('likes and unlikes', () => {
    expect(toggleLike({ count: 2, liked: false })).toEqual({ count: 3, liked: true });
    expect(toggleLike({ count: 3, liked: true })).toEqual({ count: 2, liked: false });
  });

  it('treats a missing like as not liked', () => {
    expect(toggleLike(undefined)).toEqual({ count: 1, liked: true });
  });

  it('never goes below zero', () => {
    expect(toggleLike({ count: 0, liked: true })).toEqual({ count: 0, liked: false });
  });
});
