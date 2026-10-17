// @ts-check

/**
 * Reads a list given to a helper, so that `null` or any other value counts as no list instead of
 * crashing the `filter`, `map` or `reduce` that follows. A default parameter only covers
 * `undefined`.
 * @template T
 * @param {T[] | null | undefined} value - List to read.
 * @returns {T[]} The list itself, or an empty list when the value is not an array.
 * @example
 * toList(['index.html']); // ['index.html']
 * toList(null); // []
 */
export const toList = value => (Array.isArray(value) ? value : []);
