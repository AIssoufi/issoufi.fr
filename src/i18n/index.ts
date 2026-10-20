import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { APP_TRANSLATIONS, DEFAULT_LANGUAGE, LANGUAGES } from './constants.ts';
import { resolveInitialLanguage } from './storage.ts';
import type { Language, Translations } from './types.ts';

/** Namespace of every text of the site, the default one of i18next. */
const NAMESPACE = 'translation';

i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    LANGUAGES.map(language => [language, { [NAMESPACE]: APP_TRANSLATIONS[language] }]),
  ),
  // With the resources inline, init is synchronous: the first render is already in the language of
  // the URL, so the page never shows French before switching. The root URL first goes to the home
  // page of the language the visitor chose before
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Adds groups of texts to every language, each replacing the group of the same name if there is
 * one. A lazy page adds its own from its chunk, before it renders, so that the initial load carries
 * the texts of the app only. Every language comes at once: the language toggle then switches
 * without loading anything. The texts are copied, never merged into {@link APP_TRANSLATIONS},
 * which a deep merge of i18next would change.
 *
 * @param translations - Groups of texts of each language, of the shape of {@link Translations}. A
 * missing language gets none.
 * @example
 * addTranslations({ fr: { projects: frProjects }, en: { projects: enProjects } });
 */
export const addTranslations = (translations: Record<Language, Partial<Translations>>) =>
  LANGUAGES.forEach(language =>
    i18n.addResourceBundle(language, NAMESPACE, translations?.[language] ?? {}),
  );

export default i18n;
