import { type FocusEvent, type PointerEvent, useState } from 'react';

import { useEscapeKey } from '../../../../hooks/useEscapeKey';

/** Value of `PointerEvent.pointerType` for a finger, whose tap is no hover. */
const TOUCH_POINTER_TYPE = 'touch';

/** Pseudo-class of an element focused with the keyboard, rather than by a click or a tap. */
const FOCUS_VISIBLE_SELECTOR = ':focus-visible';

/** Event handlers of {@link useTooltip}, for the element that holds the trigger and the tooltip. */
interface TooltipTriggerHandlers {
  /** Shows the tooltip when a mouse or a pen hovers the element, never for a finger. */
  onPointerEnter: (event: PointerEvent<HTMLElement>) => void;
  /** Hides the tooltip shown by the pointer, unless the keyboard focus keeps it. */
  onPointerLeave: () => void;
  /** Shows the tooltip when the keyboard focuses the trigger, not on a click or a tap. */
  onFocus: (event: FocusEvent<HTMLElement>) => void;
  /** Hides the tooltip shown by the focus, unless the pointer still hovers the element. */
  onBlur: () => void;
}

/** Result of {@link useTooltip}. */
interface UseTooltipResult {
  /** Whether the tooltip shows. */
  isOpen: boolean;
  /**
   * Handlers to set on an element that holds both the trigger and the tooltip, so the pointer can
   * move from the trigger onto the tooltip without closing it.
   */
  triggerHandlers: TooltipTriggerHandlers;
}

/**
 * Tells when a tooltip shows: while a mouse or a pen hovers its trigger or the tooltip itself, and
 * while the keyboard focuses the trigger. A finger never opens it, as a tap only follows the link
 * or presses the button: the accessible name already says what it does. `Escape` closes it
 * wherever the focus is, until the pointer hovers it again or the keyboard focuses it again, and
 * closes nothing else: a menu that holds the trigger stays open until the next `Escape`. Listens
 * to `Escape` only while the tooltip shows.
 *
 * @example
 * const { isOpen, triggerHandlers } = useTooltip();
 *
 * <span {...triggerHandlers}>
 *   <button aria-labelledby="tip">CV</button>
 *   <span id="tip" role="tooltip" hidden={!isOpen}>Download the CV</span>
 * </span>
 */
export function useTooltip(): UseTooltipResult {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusedByKeyboard, setIsFocusedByKeyboard] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isOpen = (isHovered || isFocusedByKeyboard) && !isDismissed;

  useEscapeKey({ isActive: isOpen, onEscape: () => setIsDismissed(true), isTopLayer: true });

  const triggerHandlers: TooltipTriggerHandlers = {
    onPointerEnter: event => {
      const isFinger = event.pointerType === TOUCH_POINTER_TYPE;
      if (isFinger) return;

      setIsHovered(true);
      setIsDismissed(false);
    },
    onPointerLeave: () => setIsHovered(false),
    onFocus: event => {
      const isKeyboardFocus = event.target.matches(FOCUS_VISIBLE_SELECTOR);
      if (!isKeyboardFocus) return;

      setIsFocusedByKeyboard(true);
      setIsDismissed(false);
    },
    onBlur: () => setIsFocusedByKeyboard(false),
  };

  return { isOpen, triggerHandlers };
}
