/**
 * Playback of the icon animation when the menu opens: forward (Lottie direction `1`), from the
 * burger to the cross, at 1.5 times its normal speed.
 */
export const OPEN_ANIMATION = { speedMultiplier: 1.5, direction: 1 } as const;

/**
 * Playback of the icon animation when the menu closes: backward (Lottie direction `-1`), from the
 * cross to the burger, at 4 times its normal speed so the burger is back almost at once.
 */
export const CLOSE_ANIMATION = { speedMultiplier: 4, direction: -1 } as const;
