import { useEffect, useEffectEvent } from 'react';

/** Value of `KeyboardEvent.key` for the `Escape` key. */
const ESCAPE_KEY = 'Escape';

/** Parameters of {@link useEscapeKey}. */
interface UseEscapeKeyParams {
  /** Whether `Escape` is listened to. @default true */
  isActive?: boolean;
  /** Called when `Escape` is pressed, wherever the focus is in the page. */
  onEscape?: () => void;
}

/**
 * Calls `onEscape` when the `Escape` key is pressed while active, for instance to close a menu or
 * a dialog. Listens to `keydown` on `document` only while active, and always calls the latest
 * `onEscape`. The listener is removed once inactive and on unmount.
 */
export function useEscapeKey({ isActive = true, onEscape }: UseEscapeKeyParams): void {
  const handleEscape = useEffectEvent(() => onEscape?.());

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ESCAPE_KEY) handleEscape();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
}
