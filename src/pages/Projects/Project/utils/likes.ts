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
