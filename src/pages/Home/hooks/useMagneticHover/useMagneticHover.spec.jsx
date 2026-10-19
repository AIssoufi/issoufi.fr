import { renderHook } from '@testing-library/react';

import { stubMatchMedia } from '../../../../mediaQueryTestUtils';
import { MAGNET_FOLLOW_TRANSITION, MAGNET_RELEASE_TRANSITION } from '../../constants';
import { useMagneticHover } from './useMagneticHover';

const elementAt = rect => {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => rect;
  return element;
};

describe('useMagneticHover', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('moves the element toward the pointer', () => {
    const { result } = renderHook(() => useMagneticHover());
    const element = elementAt({ left: 100, top: 100, width: 200, height: 50 });

    result.current.onPointerMove({ currentTarget: element, clientX: 250, clientY: 145 });

    expect(element.style.transform).toBe('translate(20px, 8px)');
    expect(element.style.transition).toBe(MAGNET_FOLLOW_TRANSITION);
  });

  it('moves the element toward a pen too', () => {
    const { result } = renderHook(() => useMagneticHover());
    const element = elementAt({ left: 100, top: 100, width: 200, height: 50 });

    result.current.onPointerMove({
      currentTarget: element,
      pointerType: 'pen',
      clientX: 250,
      clientY: 145,
    });

    expect(element.style.transform).toBe('translate(20px, 8px)');
  });

  it('leaves the element in its place under a finger, which would leave it moved after a tap', () => {
    const { result } = renderHook(() => useMagneticHover());
    const element = elementAt({ left: 100, top: 100, width: 200, height: 50 });

    result.current.onPointerMove({
      currentTarget: element,
      pointerType: 'touch',
      clientX: 250,
      clientY: 145,
    });

    expect(element.style.transform).toBe('');
    expect(element.style.transition).toBe('');
  });

  it('eases the element back on leave', () => {
    const { result } = renderHook(() => useMagneticHover());
    const element = elementAt({ left: 0, top: 0, width: 10, height: 10 });
    element.style.transform = 'translate(4px, 4px)';

    result.current.onPointerLeave({ currentTarget: element });

    expect(element.style.transform).toBe('');
    expect(element.style.transition).toBe(MAGNET_RELEASE_TRANSITION);
  });

  it('returns the same handlers across renders while the preference stays the same', () => {
    const { result, rerender } = renderHook(() => useMagneticHover());
    const first = result.current;

    rerender();

    expect(result.current.onPointerMove).toBe(first.onPointerMove);
    expect(result.current.onPointerLeave).toBe(first.onPointerLeave);
  });

  describe('with reduced motion', () => {
    it('leaves the element in its place while hovered', () => {
      stubMatchMedia({ matches: true });
      const { result } = renderHook(() => useMagneticHover());
      const element = elementAt({ left: 100, top: 100, width: 200, height: 50 });

      result.current.onPointerMove({ currentTarget: element, clientX: 250, clientY: 145 });

      expect(element.style.transform).toBe('');
      expect(element.style.transition).toBe('');
    });

    it('still puts back on leave an element moved before the visitor turned it on', () => {
      const { setMatches } = stubMatchMedia({ matches: false });
      const { result } = renderHook(() => useMagneticHover());
      const element = elementAt({ left: 100, top: 100, width: 200, height: 50 });
      result.current.onPointerMove({ currentTarget: element, clientX: 250, clientY: 145 });

      setMatches(true);
      result.current.onPointerMove({ currentTarget: element, clientX: 300, clientY: 150 });
      expect(element.style.transform).toBe('translate(20px, 8px)');

      result.current.onPointerLeave({ currentTarget: element });
      expect(element.style.transform).toBe('');
    });

    it('moves the element again once the visitor turns it off', () => {
      const { setMatches } = stubMatchMedia({ matches: true });
      const { result } = renderHook(() => useMagneticHover());
      const element = elementAt({ left: 100, top: 100, width: 200, height: 50 });

      setMatches(false);
      result.current.onPointerMove({ currentTarget: element, clientX: 250, clientY: 145 });

      expect(element.style.transform).toBe('translate(20px, 8px)');
    });
  });
});
