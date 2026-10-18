import { act, fireEvent, renderHook } from '@testing-library/react';
import type { FocusEvent, PointerEvent } from 'react';
import type { MockInstance } from 'vitest';

import { useTooltip } from './useTooltip';

/** A pointer event of React, as `onPointerEnter` receives it, for a type of pointer. */
const pointerEvent = (pointerType: string) =>
  ({ pointerType }) as unknown as PointerEvent<HTMLElement>;

/** A focus event of React on a target that matches `:focus-visible` or not. */
const focusEvent = (isFocusVisible: boolean) => {
  const matches = vi.fn((selector: string) => selector === ':focus-visible' && isFocusVisible);
  const event = { target: { matches } } as unknown as FocusEvent<HTMLElement>;
  return { event, matches };
};

/** Presses a key on the focused element, or on the body without one, as a user would. */
const pressKey = (key: string) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key });

describe('useTooltip', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts closed', () => {
    const { result } = renderHook(() => useTooltip());
    expect(result.current.isOpen).toBe(false);
  });

  describe('hover', () => {
    it.each(['mouse', 'pen'])('opens while a %s hovers the trigger', pointerType => {
      const { result } = renderHook(() => useTooltip());

      act(() => result.current.triggerHandlers.onPointerEnter(pointerEvent(pointerType)));
      expect(result.current.isOpen).toBe(true);

      act(() => result.current.triggerHandlers.onPointerLeave());
      expect(result.current.isOpen).toBe(false);
    });

    it('stays closed for a finger, whose tap only follows the link', () => {
      const { result } = renderHook(() => useTooltip());

      act(() => result.current.triggerHandlers.onPointerEnter(pointerEvent('touch')));

      expect(result.current.isOpen).toBe(false);
    });

    it.each(['', 'unknown'])(
      'opens for the unknown pointer type %j, as for a mouse',
      pointerType => {
        const { result } = renderHook(() => useTooltip());

        act(() => result.current.triggerHandlers.onPointerEnter(pointerEvent(pointerType)));

        expect(result.current.isOpen).toBe(true);
      },
    );

    it('stays closed when the pointer leaves without having entered', () => {
      const { result } = renderHook(() => useTooltip());

      act(() => result.current.triggerHandlers.onPointerLeave());

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('focus', () => {
    it('opens while the keyboard focuses the trigger', () => {
      const { result } = renderHook(() => useTooltip());
      const { event, matches } = focusEvent(true);

      act(() => result.current.triggerHandlers.onFocus(event));
      expect(matches).toHaveBeenCalledWith(':focus-visible');
      expect(result.current.isOpen).toBe(true);

      act(() => result.current.triggerHandlers.onBlur());
      expect(result.current.isOpen).toBe(false);
    });

    it('stays closed when a click or a tap focuses the trigger', () => {
      const { result } = renderHook(() => useTooltip());

      act(() => result.current.triggerHandlers.onFocus(focusEvent(false).event));

      expect(result.current.isOpen).toBe(false);
    });

    it('stays open while the keyboard focus remains once the pointer leaves', () => {
      const { result } = renderHook(() => useTooltip());

      act(() => {
        result.current.triggerHandlers.onPointerEnter(pointerEvent('mouse'));
        result.current.triggerHandlers.onFocus(focusEvent(true).event);
      });
      act(() => result.current.triggerHandlers.onPointerLeave());
      expect(result.current.isOpen).toBe(true);

      act(() => result.current.triggerHandlers.onBlur());
      expect(result.current.isOpen).toBe(false);
    });

    it('stays open while the pointer hovers once the focus leaves', () => {
      const { result } = renderHook(() => useTooltip());

      act(() => {
        result.current.triggerHandlers.onFocus(focusEvent(true).event);
        result.current.triggerHandlers.onPointerEnter(pointerEvent('mouse'));
      });
      act(() => result.current.triggerHandlers.onBlur());

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('Escape', () => {
    it('closes the tooltip opened by the pointer, which reopens on the next hover', () => {
      const { result } = renderHook(() => useTooltip());
      act(() => result.current.triggerHandlers.onPointerEnter(pointerEvent('mouse')));

      act(() => pressKey('Escape'));
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.triggerHandlers.onPointerLeave();
        result.current.triggerHandlers.onPointerEnter(pointerEvent('mouse'));
      });
      expect(result.current.isOpen).toBe(true);
    });

    it('closes the tooltip opened by the keyboard, which reopens on the next focus', () => {
      const { result } = renderHook(() => useTooltip());
      act(() => result.current.triggerHandlers.onFocus(focusEvent(true).event));

      act(() => pressKey('Escape'));
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.triggerHandlers.onBlur();
        result.current.triggerHandlers.onFocus(focusEvent(true).event);
      });
      expect(result.current.isOpen).toBe(true);
    });

    it('keeps the tooltip closed when a click focuses the trigger after Escape', () => {
      const { result } = renderHook(() => useTooltip());
      act(() => result.current.triggerHandlers.onPointerEnter(pointerEvent('mouse')));

      act(() => pressKey('Escape'));
      act(() => result.current.triggerHandlers.onFocus(focusEvent(false).event));

      expect(result.current.isOpen).toBe(false);
    });

    it.each(['Enter', 'Esc', 'escape', ''])('ignores the key %j', key => {
      const { result } = renderHook(() => useTooltip());
      act(() => result.current.triggerHandlers.onPointerEnter(pointerEvent('mouse')));

      act(() => pressKey(key));

      expect(result.current.isOpen).toBe(true);
    });

    it('closes nothing else, such as the menu that holds the trigger', () => {
      const onMenuEscape = vi.fn();
      document.addEventListener('keydown', onMenuEscape);
      try {
        const { result } = renderHook(() => useTooltip());
        act(() => result.current.triggerHandlers.onPointerEnter(pointerEvent('mouse')));

        act(() => pressKey('Escape'));
        expect(result.current.isOpen).toBe(false);
        expect(onMenuEscape).not.toHaveBeenCalled();

        // Once the tooltip is closed, the next Escape reaches the menu
        act(() => pressKey('Escape'));
        expect(onMenuEscape).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener('keydown', onMenuEscape);
      }
    });

    it('listens to the keyboard only while the tooltip shows', () => {
      const addListener = vi.spyOn(document, 'addEventListener');
      const removeListener = vi.spyOn(document, 'removeEventListener');
      const keyDownCalls = (spy: MockInstance<typeof document.addEventListener>) =>
        spy.mock.calls.filter(([type]) => type === 'keydown');
      const { result } = renderHook(() => useTooltip());
      expect(keyDownCalls(addListener)).toHaveLength(0);

      act(() => result.current.triggerHandlers.onPointerEnter(pointerEvent('mouse')));
      expect(keyDownCalls(addListener)).toEqual([
        ['keydown', expect.any(Function), { capture: true }],
      ]);

      act(() => result.current.triggerHandlers.onPointerLeave());
      expect(keyDownCalls(removeListener)).toEqual(keyDownCalls(addListener));
    });

    it('stops listening to the keyboard on unmount', () => {
      const removeListener = vi.spyOn(document, 'removeEventListener');
      const { result, unmount } = renderHook(() => useTooltip());
      act(() => result.current.triggerHandlers.onPointerEnter(pointerEvent('mouse')));

      unmount();

      expect(removeListener).toHaveBeenCalledWith('keydown', expect.any(Function), {
        capture: true,
      });
    });
  });
});
