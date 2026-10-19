/** Tells whether a value is the name of a technology: a string with more than spaces. */
const isTechnologyName = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Keeps the names of technologies that a list of the data holds, in order and each once, so that a
 * mistake of the data never breaks the page: a value that is not an array, as a name written
 * without its brackets, counts as no list, and an entry that is not a name is skipped. Shared by
 * the Experiences page (`.data/experiences.json`) and the Projects page (the `tools` of each
 * project).
 *
 * @param technologies - The technologies of a job or a project, as the data gives them.
 * @returns The names to show, each once, as the React keys of their items must be; empty when
 * there is none.
 *
 * @example
 * listTechnologyNames(['React.js', 42, '', 'React.js', 'Vite']); // ['React.js', 'Vite']
 * listTechnologyNames('React.js'); // []
 */
export const listTechnologyNames = (technologies: unknown): string[] => {
  if (!Array.isArray(technologies)) return [];

  return [...new Set(technologies.filter(isTechnologyName))];
};
