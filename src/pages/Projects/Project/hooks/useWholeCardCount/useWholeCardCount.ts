import { type RefCallback, useCallback, useState, useSyncExternalStore } from 'react';

import { ROW_CARD_COUNT } from '../../constants.ts';
import type { RowMeasures } from '../../types.ts';
import { countWholeCards } from '../../utils/row.ts';

/** Parameters of {@link useWholeCardCount}. */
interface UseWholeCardCountParams {
  /**
   * Most cards to count, the number of cards that the row holds, also returned while the row
   * cannot be measured. A value that is not a whole number greater than zero counts as the
   * default.
   * @default ROW_CARD_COUNT
   */
  maxCount?: number;
}

/** Value returned by {@link useWholeCardCount}. */
interface UseWholeCardCountResult {
  /** Ref to give to the list that lays out the cards of the row. */
  listRef: RefCallback<HTMLElement>;
  /** Number of cards that the row shows whole, from 1 to `maxCount`. */
  wholeCardCount: number;
}

/** Fewest cards counted, so that the arrows still move by one when no card shows whole. */
const MIN_WHOLE_CARD_COUNT = 1;

/** Reads a length in pixels from a computed style: `NaN` when it is none, such as `normal`. */
const readPx = (value: string) => Number.parseFloat(value);

/** Whether a card of the list shows, unlike a card out of the page of the row, which has no box. */
const isShownCard = (card: Element) => getComputedStyle(card).display !== 'none';

/**
 * Measures the row from the computed styles of the list and of its first card shown, which the
 * tilt of a hovered card leaves unchanged, unlike its box on the screen. Assumes cards of the same
 * width, without padding or border, set apart by their margins and the gap of the list.
 */
const measureRow = (list: HTMLElement): Partial<RowMeasures> => {
  const firstCard = [...list.children].find(isShownCard);
  if (!firstCard) return {};

  const listStyle = getComputedStyle(list);
  const cardStyle = getComputedStyle(firstCard);
  const cardWidth = readPx(cardStyle.width);
  const marginLeft = readPx(cardStyle.marginLeft);
  // A flex row without gap computes it as `normal`
  const columnGap = readPx(listStyle.columnGap) || 0;

  return {
    rowWidth: list.clientWidth,
    firstCardStart: readPx(listStyle.paddingLeft) + marginLeft,
    cardWidth,
    cardPitch: cardWidth + marginLeft + readPx(cardStyle.marginRight) + columnGap,
  };
};

/**
 * Counts the cards that the row of a section shows whole, without scrolling it, from the width of
 * the list and of its cards: one on a phone, up to `maxCount` on a wide screen. It counts the
 * cards that fit, not those rendered, so a last page of fewer cards keeps the count of the first,
 * and measures the first card shown, past those hidden with `display: none`.
 * The count follows the list as it is resized, with a `ResizeObserver` removed on unmount.
 *
 * @returns `maxCount` until the list is rendered, and where nothing is laid out or observed, as in
 * jsdom or on the server.
 *
 * @example
 * const { listRef, wholeCardCount } = useWholeCardCount({ maxCount: 3 });
 * // <ProjectGrid ref={listRef}>…</ProjectGrid>, whose arrows move by wholeCardCount cards
 */
export function useWholeCardCount({
  maxCount = ROW_CARD_COUNT,
}: UseWholeCardCountParams = {}): UseWholeCardCountResult {
  // State rather than a ref, so that the count is measured again once the list is rendered
  const [list, setList] = useState<HTMLElement | null>(null);
  const isValidMaxCount = Number.isInteger(maxCount) && maxCount > 0;
  const limit = isValidMaxCount ? maxCount : ROW_CARD_COUNT;

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const canObserve = list !== null && typeof ResizeObserver === 'function';
      if (!canObserve) return () => {};

      const observer = new ResizeObserver(onStoreChange);
      observer.observe(list);
      return () => observer.disconnect();
    },
    [list],
  );

  const getSnapshot = () => {
    const count = list ? countWholeCards(measureRow(list)) : null;
    if (count === null) return limit;

    return Math.min(Math.max(count, MIN_WHOLE_CARD_COUNT), limit);
  };

  const wholeCardCount = useSyncExternalStore(subscribe, getSnapshot, () => limit);

  return { listRef: setList, wholeCardCount };
}
