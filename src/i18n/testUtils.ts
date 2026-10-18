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

/** Parameters of {@link getMissingKeys}. */
interface GetMissingKeysParams {
  /** Translations to check, such as the English ones. */
  translations: unknown;
  /** Translations whose every key `translations` must have, such as the French ones. */
  reference: unknown;
}

/**
 * Lists the dotted keys of the texts of `reference` that `translations` lacks, in the order of
 * `reference`. Used to name the keys a language forgot.
 *
 * @returns Every key of `reference` when `translations` is missing or not an object, and an
 * empty list when `reference` is. A key holding an object, a number or nothing instead of a text
 * counts as missing.
 *
 * @example
 * getMissingKeys({ translations: { nav: {} }, reference: { nav: { home: 'Accueil' } } });
 * // ['nav.home']
 */
export const getMissingKeys = ({ translations, reference }: GetMissingKeysParams): string[] => {
  const translatedKeys = new Set(getEntries({ value: translations }).map(([key]) => key));

  return getEntries({ value: reference })
    .map(([key]) => key)
    .filter(key => !translatedKeys.has(key));
};
