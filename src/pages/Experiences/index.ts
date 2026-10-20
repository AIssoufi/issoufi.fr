import { enExperiences } from '../../i18n/en/experiences.ts';
import { addTranslations } from '../../i18n/index.ts';
import { frExperiences } from '../../i18n/fr/experiences.ts';

// The texts of the page come with its chunk, before it renders, rather than with the app
addTranslations({ fr: { exp: frExperiences }, en: { exp: enExperiences } });

export * from './Experiences.tsx';
export { Experiences as default } from './Experiences.tsx';
