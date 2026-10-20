import { enApp } from './en/app.ts';
import { enExperiences } from './en/experiences.ts';
import { enProjects } from './en/projects.ts';
import type { Translations } from './types.ts';

/**
 * English translations, gathered from the same parts as the French ones in `fr.ts`. Typed with
 * {@link Translations}, so they must keep exactly the keys of the French ones: `tsc` names a key
 * missing from either side. As in `fr.ts`, a no-break space joins the words that belong together
 * on a line, such as "UI\u00a0Design".
 */
export const en = {
  ...enApp,
  projects: enProjects,
  exp: enExperiences,
} as const satisfies Translations;
