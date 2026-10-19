/**
 * Tells whether a value is a string with something else than white space in it, such as a URL
 * worth writing in a page.
 *
 * @param value - Any value.
 * @returns `false` for an empty or blank string and for a value that is not a string.
 *
 * @example
 * isNonBlankString('/home.webp'); // true
 * isNonBlankString(' \n'); // false
 */
export const isNonBlankString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Keeps the strings with more than white space of a list of the data, in order and each once, such
 * as the technologies of a job of the Experiences page or the tools of a project card, so that a
 * mistake of the data never breaks the page: a value that is not an array, as a name written
 * without its brackets, counts as no list, and an entry that is not such a string is skipped.
 * Here rather than next to its users, since a module that only the lazy pages import becomes a
 * chunk of its own, which the HTML file of a page does not preload.
 *
 * @param values - The list, as the data gives it.
 * @returns The strings to show, each once, as the React keys of their items must be; empty when
 * there is none.
 *
 * @example
 * listUniqueNonBlankStrings(['React.js', 42, '', 'React.js', 'Vite']); // ['React.js', 'Vite']
 * listUniqueNonBlankStrings('React.js'); // []
 */
export const listUniqueNonBlankStrings = (values: unknown): string[] => {
  if (!Array.isArray(values)) return [];

  return [...new Set(values.filter(isNonBlankString))];
};
