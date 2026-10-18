import { NO_LIKE, WHOLE_CARD_TOLERANCE_PX } from './constants';
import type { Like, LikeState, ProjectItemData } from './types';

/** Parameters of {@link getLastPageStart}. */
interface GetLastPageStartParams {
  /** Total number of cards. */
  total: number;
  /** Number of cards per page. */
  pageSize: number;
}

/** Tells whether cards can be split into pages: some cards, and a finite page size above zero. */
const canPage = ({ total, pageSize }: GetLastPageStartParams) =>
  total > 0 && pageSize > 0 && Number.isFinite(pageSize);

/**
 * Returns the index of the first card of the last page. Pages start every `pageSize` cards from
 * the first one, so the last page may hold fewer cards, in the columns of the first page.
 *
 * @returns `0` without cards, or with a page size that is not a finite number above zero, as
 * with a single page.
 *
 * @example
 * getLastPageStart({ total: 5, pageSize: 2 }); // 4
 */
export function getLastPageStart({ total, pageSize }: GetLastPageStartParams): number {
  if (!canPage({ total, pageSize })) return 0;

  return Math.floor((total - 1) / pageSize) * pageSize;
}

/** Parameters of {@link getNextPageStart}. */
interface GetNextPageStartParams {
  /** Index of the first card of the current page. */
  currentStart: number;
  /** Total number of cards. */
  total: number;
  /** Number of cards per page. */
  pageSize: number;
}

/**
 * Returns the index of the first card of the next page, staying on the last page once reached,
 * so "next" never shows an empty page.
 */
export function getNextPageStart({
  currentStart,
  total,
  pageSize,
}: GetNextPageStartParams): number {
  if (!canPage({ total, pageSize })) return 0;

  return Math.min(currentStart + pageSize, getLastPageStart({ total, pageSize }));
}

/** Parameters of {@link getPreviousPageStart}. */
interface GetPreviousPageStartParams {
  /** Index of the first card of the current page. */
  currentStart: number;
  /** Number of cards per page. */
  pageSize: number;
}

/** Returns the index of the first card of the previous page, never before the first card. */
export function getPreviousPageStart({
  currentStart,
  pageSize,
}: GetPreviousPageStartParams): number {
  return Math.max(0, currentStart - pageSize);
}

/** Measures of the row of cards of a section, in CSS pixels, at its first scroll position. */
export interface RowMeasures {
  /** Width that the row shows, its padding box, without the cards it scrolls to. */
  rowWidth: number;
  /** Distance from the left edge of the row to the left edge of its first card. */
  firstCardStart: number;
  /** Width of a card, the same for every card of the row. */
  cardWidth: number;
  /** Distance from the left edge of a card to the left edge of the next one. */
  cardPitch: number;
}

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

/** Tilt of a card toward the pointer, computed by {@link getCardTilt}. */
export interface CardTilt {
  /** Rotation around the horizontal axis, in degrees. */
  rotateX: number;
  /** Rotation around the vertical axis, in degrees. */
  rotateY: number;
  /** Pointer position inside the card, from its left edge, in pixels. */
  x: number;
  /** Pointer position inside the card, from its top edge, in pixels. */
  y: number;
}

/** Parameters of {@link getCardTilt}. */
interface GetCardTiltParams {
  /** Pointer position in the viewport (`clientX`, `clientY`). */
  pointer: { x: number; y: number };
  /** Bounding box of the card. */
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;
  /** Tilt at the card's edges, in degrees. */
  maxTilt: number;
}

/**
 * Computes how much a card tilts so that the side under the pointer goes down: no tilt at the
 * center, `maxTilt` at the edges. Returns no tilt for an empty card.
 */
export function getCardTilt({ pointer, rect, maxTilt }: GetCardTiltParams): CardTilt {
  const x = pointer.x - rect.left;
  const y = pointer.y - rect.top;
  const center = { x: rect.width / 2, y: rect.height / 2 };
  const hasArea = center.x > 0 && center.y > 0;
  if (!hasArea) return { rotateX: 0, rotateY: 0, x, y };

  return {
    rotateX: ((y - center.y) / center.y) * -maxTilt,
    rotateY: ((x - center.x) / center.x) * maxTilt,
    x,
    y,
  };
}

/**
 * Builds the initial like state from the project data.
 *
 * @param projects - Cards with their initial like count and flag.
 */
export function createInitialLikes(
  projects: Pick<ProjectItemData, 'id' | 'likeCount' | 'isLikedByOwnUser'>[],
): LikeState {
  return Object.fromEntries(
    projects.map(project => [
      project.id,
      { count: project.likeCount, liked: project.isLikedByOwnUser },
    ]),
  );
}

/**
 * Returns the like after a click: liked becomes unliked and the count follows, never below 0.
 *
 * @param like - Current like of the card; a missing like counts as not liked.
 */
export function toggleLike(like: Like = NO_LIKE): Like {
  return like.liked
    ? { count: Math.max(0, like.count - 1), liked: false }
    : { count: like.count + 1, liked: true };
}

/** Whether a value is a string holding more than whitespace. */
const isFilledString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Returns the url that the card title links to, or `undefined` when the card gets no link: it
 * needs a url to open, and a name for the link text, without which screen readers would announce
 * an unnamed link.
 *
 * @param project - Card data, which may come from JSON with missing or wrong fields; `null` or
 * `undefined` gets no link.
 *
 * @example
 * getProjectLinkUrl({ url: 'https://example.com', name: 'Chess' }); // 'https://example.com'
 * getProjectLinkUrl({ url: 'https://example.com', name: '' }); // undefined
 */
export function getProjectLinkUrl(
  project?: Partial<Pick<ProjectItemData, 'url' | 'name'>> | null,
): string | undefined {
  const { url, name } = project ?? {};
  const canLink = isFilledString(url) && isFilledString(name);
  return canLink ? url : undefined;
}
