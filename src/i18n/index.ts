import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE } from './constants';
import { en } from './en';
import { fr } from './fr';
import { resolveInitialLanguage } from './storage';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  // With the resources inline, init is synchronous: the first render is already in the language of
  // the URL, so the page never shows French before switching. The root URL first goes to the home
  // page of the language the visitor chose before
  lng: resolveInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
  // Otherwise i18next prints an advertising notice in the console of every page
  showSupportNotice: false,
});

export default i18n;
