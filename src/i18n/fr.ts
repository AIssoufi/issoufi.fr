import { frApp } from './fr/app.ts';
import { frExperiences } from './fr/experiences.ts';
import { frProjects } from './fr/projects.ts';

/**
 * French translations: the default and fallback language. Gathers the texts of the app
 * (`fr/app.ts`), which i18next starts with and the static page metadata generated at build time
 * reads, and those of each lazy page (`fr/projects.ts`, `fr/experiences.ts`), loaded with its
 * chunk.
 *
 * Following French typography, a colon comes after a no-break space (`\u00a0`), and a semicolon,
 * question or exclamation mark after a narrow no-break space (`\u202f`), so that they never wrap
 * alone onto the next line. Apostrophes are typographic (’), never straight ('). A no-break space
 * also joins the words that belong together on a line, such as "UI\u00a0Design",
 * "applications\u00a0web" or a city and its department ("Paris\u00a0(75)"), and the same words in
 * `en.ts`.
 */
export const fr = { ...frApp, projects: frProjects, exp: frExperiences } as const;
