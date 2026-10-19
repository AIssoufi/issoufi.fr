import { isNonBlankString } from '../../../utils/strings.ts';
import { ROW_CARD_COUNT, WHOLE_CARD_TOLERANCE_PX } from './constants.ts';
import type { ProjectItemData, RowMeasures, ThumbnailFile, ThumbnailSources } from './types.ts';

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
 *
 * @returns `0` without cards, or with a page size that is not a finite number above zero, as
 * with a single page.
 *
 * @example
 * getNextPageStart({ currentStart: 0, total: 4, pageSize: 1 }); // 1
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

/** Whether a value can be the id of a project: an integer, as every `id` of the data is. */
const isProjectId = (value: unknown): value is number => Number.isInteger(value);

/**
 * Reads the ids of the liked projects from the text kept in `localStorage`, a JSON list.
 *
 * @param storedValue - Text of the storage, which another version of the site, an extension or
 * the visitor may have changed; `null` when the key is not stored.
 * @returns The ids, without duplicates. None when the text is missing, empty, not valid JSON or
 * not a list; an entry that is not an integer, such as `"1"`, `1.5` or `null`, is left out.
 *
 * @example
 * parseLikedIds('[1,5]'); // Set { 1, 5 }
 * parseLikedIds('{"1":true}'); // Set {}
 */
export function parseLikedIds(storedValue: string | null): Set<number> {
  if (storedValue === null) return new Set();

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(storedValue);
  } catch {
    // An empty or truncated text, or one written by something else, likes nothing
    return new Set();
  }

  return new Set(Array.isArray(parsedValue) ? parsedValue.filter(isProjectId) : []);
}

/** Parameters of {@link setLike}. */
interface SetLikeParams {
  /** Ids of the projects liked so far, left unchanged. */
  likedIds: ReadonlySet<number>;
  /** Id of the project whose like changes. */
  id: number;
  /** Whether the project is liked from now on. */
  isLiked: boolean;
}

/**
 * Returns the ids of the liked projects once the like of `id` is set or removed, in a new set.
 *
 * @example
 * setLike({ likedIds: new Set([1]), id: 5, isLiked: true }); // Set { 1, 5 }
 * setLike({ likedIds: new Set([1]), id: 1, isLiked: false }); // Set {}
 */
export function setLike({ likedIds, id, isLiked }: SetLikeParams): Set<number> {
  const nextLikedIds = new Set(likedIds);
  if (isLiked) nextLikedIds.add(id);
  else nextLikedIds.delete(id);
  return nextLikedIds;
}

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
  const canLink = isNonBlankString(url) && isNonBlankString(name);
  return canLink ? url : undefined;
}

/** Parameters of {@link getPageProjects}. */
interface GetPageProjectsParams {
  /** Every project of the section, in their order. */
  projects: readonly ProjectItemData[];
  /** Index of the first card of the page. */
  pageStart: number;
}

/** Whether a value can start a page: a whole number of cards from the first one. */
const isPageStart = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

/**
 * Returns the projects that the row shows from a page: {@link ROW_CARD_COUNT} cards from its
 * first one, those it shows whole and the next ones, which it scrolls to.
 *
 * @returns Fewer cards on the last page, and none past the last project. A start that is not a
 * whole number from zero, such as `-1`, `1.5` or `NaN`, shows the first page.
 *
 * @example
 * getPageProjects({ projects: [chess, calculator, store, connectFour], pageStart: 1 });
 * // [calculator, store, connectFour]
 */
export function getPageProjects({ projects, pageStart }: GetPageProjectsParams): ProjectItemData[] {
  const start = isPageStart(pageStart) ? pageStart : 0;
  return projects.slice(start, start + ROW_CARD_COUNT);
}

/** Any white space character, which would split a URL of a `srcset` in two. */
const WHITE_SPACE_PATTERN = /\s/;

/** Whether a value is a whole number of pixels above zero, as the width or height of a file. */
const isPixelCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0;

/** Whether an item of the JSON data is a file of a thumbnail that a `srcset` can name. */
const isThumbnailFile = (file: unknown): file is ThumbnailFile => {
  const isObject = typeof file === 'object' && file !== null;
  if (!isObject) return false;

  const { url, width, height } = file as Partial<ThumbnailFile>;
  const isSrcSetUrl = isNonBlankString(url) && !WHITE_SPACE_PATTERN.test(url);
  return isSrcSetUrl && isPixelCount(width) && isPixelCount(height);
};

/** Orders thumbnail files from the narrowest to the widest. */
const byWidth = (first: ThumbnailFile, second: ThumbnailFile) => first.width - second.width;

/**
 * Builds the attributes of the `img` of a thumbnail from its files: a `srcset` that names each
 * file with its width, from the narrowest, and the widest file as its `src`, whose width and
 * height give the `img` the ratio of the screenshot.
 *
 * @param files - `thumbnails` of a project, which may come from JSON with missing or wrong fields.
 * @returns `undefined` without a valid file. A file without a URL, with a URL holding white space,
 * or without a whole number of pixels above zero as its width and height is left out, and so is a
 * file of the same width as an earlier one, which a `srcset` cannot hold twice.
 *
 * @example
 * getThumbnailSources([
 *   { url: '/chess-480.webp', width: 480, height: 300 },
 *   { url: '/chess-960.webp', width: 960, height: 600 },
 * ]);
 * // { src: '/chess-960.webp', srcSet: '/chess-480.webp 480w, /chess-960.webp 960w',
 * //   width: 960, height: 600 }
 */
export function getThumbnailSources(files?: unknown): ThumbnailSources | undefined {
  if (!Array.isArray(files)) return undefined;

  const filesByWidth = new Map<number, ThumbnailFile>();
  files.filter(isThumbnailFile).forEach(file => {
    if (!filesByWidth.has(file.width)) filesByWidth.set(file.width, file);
  });
  const sortedFiles = [...filesByWidth.values()].sort(byWidth);
  const widestFile = sortedFiles[sortedFiles.length - 1];
  if (!widestFile) return undefined;

  return {
    src: widestFile.url,
    srcSet: sortedFiles.map(({ url, width }) => `${url} ${width}w`).join(', '),
    width: widestFile.width,
    height: widestFile.height,
  };
}
