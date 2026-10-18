import { NO_LIKE } from './constants';
import type { Like, LikeState, ProjectItemData } from './types';

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
  const hasCards = total > 0 && pageSize > 0;
  if (!hasCards) return 0;

  const lastPageStart = Math.floor((total - 1) / pageSize) * pageSize;
  return Math.min(currentStart + pageSize, lastPageStart);
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
