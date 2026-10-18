import type { ProjectItemData } from './Project/types';

/**
 * One project, as stored in `.data/*-projects.json`: a card whose texts are keys of the
 * translations, so that each language shows its own, translated by `translateProjects`
 * (`utils.ts`).
 */
export interface ProjectData extends Omit<ProjectItemData, 'name' | 'type'> {
  /** Key of the project name in the `projects.names` translations, e.g. `chess`. */
  nameKey: string;
  /** Key of the kind of project in the `projects.types` translations, e.g. `webApp`. */
  typeKey: string;
}
