import { getCardTilt } from './tilt.ts';

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
