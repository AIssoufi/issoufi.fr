/** Parameters of {@link getEntries}. */
interface GetEntriesParams {
  /** A translation, or an object of nested translations. */
  value: unknown;
  /** Dotted key of `value`, empty at the root. */
  key?: string;
}

/**
 * Lists every translation of a nested translations object, as `[dotted key, text]` pairs. Used by
 * the translation tests.
 *
 * @returns An empty list for a value that is neither a text nor an object.
 *
 * @example
 * getEntries({ value: { nav: { home: 'Accueil' } } }); // [['nav.home', 'Accueil']]
 */
export const getEntries = ({ value, key = '' }: GetEntriesParams): [string, string][] => {
  if (typeof value === 'string') return [[key, value]];
  if (typeof value !== 'object' || value === null) return [];

  return Object.entries(value).flatMap(([childKey, child]) =>
    getEntries({ value: child, key: key ? `${key}.${childKey}` : childKey }),
  );
};
