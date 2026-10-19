import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE, LANGUAGES, TRANSLATIONS } from './constants';
import { resolveInitialLanguage } from './storage';

i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    LANGUAGES.map(language => [language, { translation: TRANSLATIONS[language] }]),
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

export default i18n;
