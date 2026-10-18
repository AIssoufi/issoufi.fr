import { useEffect, useEffectEvent } from 'react';

/** Value of `KeyboardEvent.key` for the `Escape` key. */
const ESCAPE_KEY = 'Escape';

/** Parameters of {@link useEscapeKey}. */
interface UseEscapeKeyParams {
  /** Whether `Escape` is listened to. @default true */
  isActive?: boolean;
  /** Called when `Escape` is pressed, wherever the focus is in the page. */
  onEscape?: () => void;
  /**
   * Whether what `Escape` closes sits over other layers that close on `Escape` too, such as a
   * tooltip in the open mobile menu. Its listener then runs first, in the capture phase, and keeps
   * that `Escape` from reaching the others, so that each press closes one layer only.
   * @default false
   */
  isTopLayer?: boolean;
}

/**
 * Calls `onEscape` when the `Escape` key is pressed while active, for instance to close a menu or
 * a dialog. Listens to `keydown` on `document` only while active, in the capture phase and
 * stopping the event for a top layer (see `isTopLayer`), and always calls the latest `onEscape`.
 * The listener is removed once inactive and on unmount.
 */
export function useEscapeKey({
  isActive = true,
  onEscape,
  isTopLayer = false,
}: UseEscapeKeyParams): void {
  const handleEscape = useEffectEvent(() => onEscape?.());

  useEffect(() => {
    if (!isActive) return;

    const listenerOptions = { capture: isTopLayer };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== ESCAPE_KEY) return;

      if (isTopLayer) event.stopPropagation();
      handleEscape();
    };

    document.addEventListener('keydown', handleKeyDown, listenerOptions);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, listenerOptions);
    };
  }, [isActive, isTopLayer]);
}
