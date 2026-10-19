import { isFingerPointer } from './pointer.ts';

describe('isFingerPointer', () => {
  it('is true for a finger on a touch screen', () => {
    expect(isFingerPointer({ pointerType: 'touch' })).toBe(true);
  });

  it.each(['mouse', 'pen'])('is false for a %s, which hovers', pointerType => {
    expect(isFingerPointer({ pointerType })).toBe(false);
  });

  describe('edge cases', () => {
    it.each([
      ['an empty pointer type', { pointerType: '' }],
      ['a pointer type in capitals', { pointerType: 'TOUCH' }],
      ['an event without a pointer type', {} as Pick<PointerEvent, 'pointerType'>],
      ['null', null],
      ['nothing', undefined],
    ])('is false for %s', (_case, event) => {
      expect(isFingerPointer(event)).toBe(false);
    });
  });
});
