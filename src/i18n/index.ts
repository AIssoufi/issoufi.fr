import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getYearsOfExperience } from '../utils/career';
import { en } from './en';
import { fr } from './fr';

// Keeps the lang attribute, the title and the meta description in line with the active language
i18n.on('languageChanged', lng => {
  document.documentElement.lang = lng;
  document.title = i18n.t('meta.title');
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', i18n.t('meta.description', { years: getYearsOfExperience() }));
});

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
