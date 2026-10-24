import { LIKED_PROJECTS_STORAGE_KEY } from './constants.ts';
import { parseLikedIds, setLike } from './utils/likes.ts';

/**
 * Returns the ids of the projects that the visitor liked on a previous visit, in either language,
 * read from `localStorage`.
 *
 * @returns The stored ids, or none on a first visit, when the stored value is not a list of ids
 * (see {@link parseLikedIds}), or when the browser blocks the storage.
 */
export function getStoredLikedIds(): Set<number> {
  try {
    return parseLikedIds(localStorage.getItem(LIKED_PROJECTS_STORAGE_KEY));
  } catch {
    // Reading the storage throws when the browser blocks it, as with cookies disabled
    return new Set();
  }
}

/** Parameters of {@link storeLike}. */
interface StoreLikeParams {
  /** Id of the project whose like changes. */
  id: number;
  /** Whether the visitor likes the project from now on. */
  isLiked: boolean;
}

/**
 * Sets or removes the like of a project in `localStorage`, so that it survives a reload and a
 * change of language. It reads the stored ids again first, so the likes stored by the other
 * sections of the page stay. Does nothing when the storage is blocked or full: the like then
 * only lasts for the visit.
 */
export function storeLike({ id, isLiked }: StoreLikeParams): void {
  try {
    const likedIds = setLike({ likedIds: getStoredLikedIds(), id, isLiked });
    localStorage.setItem(LIKED_PROJECTS_STORAGE_KEY, JSON.stringify([...likedIds]));
  } catch {
    // The like still shows on the card, it is just not remembered
  }
}
