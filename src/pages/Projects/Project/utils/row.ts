import { WHOLE_CARD_TOLERANCE_PX } from '../constants.ts';
import type { RowMeasures } from '../types.ts';

/** Parameters of {@link countWholeCards}. */
interface CountWholeCardsParams extends Partial<RowMeasures> {
  /**
   * How far a card may pass the right edge of the row and still count. A negative or invalid
   * value counts as none.
   * @default WHOLE_CARD_TOLERANCE_PX
   */
  tolerancePx?: number;
}

/** Tells whether a value is a finite number, which a measured length is. */
const isLength = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Tells whether a value is a length greater than zero, which a laid out box has. */
const isPositiveLength = (value: unknown): value is number => isLength(value) && value > 0;

/**
 * Counts the cards that a row shows whole before it scrolls: the first one, then each next one, a
 * pitch further, while it ends inside the row. It counts the cards that fit, whether the row holds
 * that many or not, so the last page of the row, which may hold fewer, counts as many as the first.
 *
 * @returns `null` when the row cannot be measured, since a length is not a number greater than
 * zero (nothing is laid out, as in jsdom), or the first card starts at a negative or invalid
 * distance; `0` when even the first card passes the edge of the row.
 *
 * @example
 * // A phone 375 px wide: one card between the page gutters, the next one starts in the right one
 * countWholeCards({ rowWidth: 375, firstCardStart: 24, cardWidth: 327, cardPitch: 337 }); // 1
 */
export function countWholeCards({
  rowWidth,
  firstCardStart,
  cardWidth,
  cardPitch,
  tolerancePx = WHOLE_CARD_TOLERANCE_PX,
}: CountWholeCardsParams = {}): number | null {
  const isLaidOut =
    isPositiveLength(rowWidth) && isPositiveLength(cardWidth) && isPositiveLength(cardPitch);
  const isStartValid = isLength(firstCardStart) && firstCardStart >= 0;
  if (!isLaidOut || !isStartValid) return null;

  const tolerance = isLength(tolerancePx) ? Math.max(0, tolerancePx) : 0;
  const spaceAfterFirstCard = rowWidth - firstCardStart - cardWidth + tolerance;
  if (spaceAfterFirstCard < 0) return 0;

  return Math.floor(spaceAfterFirstCard / cardPitch) + 1;
}
