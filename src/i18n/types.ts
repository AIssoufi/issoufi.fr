import type { LANGUAGES } from './constants.ts';
import type { fr } from './fr.ts';

/** Code of one of the site's {@link LANGUAGES}, as i18next and the `lang` attribute use it. */
export type Language = (typeof LANGUAGES)[number];

/** The nested keys of a translations object, each text widened to any `string`. */
type TranslationsOf<T> = {
  readonly [Key in keyof T]: T[Key] extends string ? string : TranslationsOf<T[Key]>;
};

/**
 * Shape of the translations of every language: the keys of the French ones, the default
 * language, with texts of their own. Applied with `satisfies`, it makes `tsc` name a key that a
 * language lacks or that French does not have.
 */
export type Translations = TranslationsOf<typeof fr>;
