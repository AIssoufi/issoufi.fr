import { enProjects } from '../../i18n/en/projects.ts';
import { addTranslations } from '../../i18n/index.ts';
import { frProjects } from '../../i18n/fr/projects.ts';

// The texts of the page come with its chunk, before it renders, rather than with the app
addTranslations({ fr: { projects: frProjects }, en: { projects: enProjects } });

export * from './Projects.tsx';
export { Projects as default } from './Projects.tsx';
