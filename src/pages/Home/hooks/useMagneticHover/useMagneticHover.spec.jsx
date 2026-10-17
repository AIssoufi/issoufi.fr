import { renderHook } from '@testing-library/react';

import { MAGNET_FOLLOW_TRANSITION, MAGNET_RELEASE_TRANSITION } from '../../constants';
import { useMagneticHover } from './useMagneticHover';

const elementAt = rect => {
  const element = document.createElement('div');
  element.getBoundingClientRect = () => rect;
  return element;
};

describe('useMagneticHover', () => {
  it('moves the element toward the pointer', () => {
    const { result } = renderHook(() => useMagneticHover());
    const element = elementAt({ left: 100, top: 100, width: 200, height: 50 });

    result.current.onMouseMove({ currentTarget: element, clientX: 250, clientY: 145 });

    expect(element.style.transform).toBe('translate(20px, 8px)');
    expect(element.style.transition).toBe(MAGNET_FOLLOW_TRANSITION);
  });

  it('eases the element back on leave', () => {
    const { result } = renderHook(() => useMagneticHover());
    const element = elementAt({ left: 0, top: 0, width: 10, height: 10 });
    element.style.transform = 'translate(4px, 4px)';

    result.current.onMouseLeave({ currentTarget: element });

    expect(element.style.transform).toBe('');
    expect(element.style.transition).toBe(MAGNET_RELEASE_TRANSITION);
  });

  it('returns the same handlers across renders', () => {
    const { result, rerender } = renderHook(() => useMagneticHover());
    const first = result.current;

    rerender();

    expect(result.current.onMouseMove).toBe(first.onMouseMove);
    expect(result.current.onMouseLeave).toBe(first.onMouseLeave);
  });
});
