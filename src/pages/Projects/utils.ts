import type { TFunction } from 'i18next';

import type { ProjectItemData } from './Project/types';
import { PROJECT_NAMES_KEY, PROJECT_TYPES_KEY } from './constants';
import type { ProjectData } from './types';

/** Parameters of {@link translateChild}. */
interface TranslateChildParams {
  /** Translation function of the language to show. */
  t: TFunction;
  /** Translation key of the group of texts, e.g. `projects.names`. */
  parentKey: string;
  /** Key of the text in its group, as written in the JSON data, so of any type. */
  childKey: unknown;
}

/**
 * Whether a key of the JSON data can name a text: a filled string, and not a property that every
 * object inherits, such as `constructor`, for which i18next would return a function.
 */
const isTextKey = (key: unknown): key is string =>
  typeof key === 'string' && key.trim() !== '' && !(key in Object.prototype);

/** Text of a key of a group of translations, or an empty text when no translation has it. */
const translateChild = ({ t, parentKey, childKey }: TranslateChildParams): string => {
  if (!isTextKey(childKey)) return '';

  // Without a default value, i18next would show the key itself in place of a missing text
  return t(`${parentKey}.${childKey}`, { defaultValue: '' });
};

/** Whether an item of the JSON data is an object other than a list, as a project is. */
const isObject = (item: unknown): item is ProjectData =>
  typeof item === 'object' && item !== null && !Array.isArray(item);

/** Parameters of {@link translateProjects}. */
interface TranslateProjectsParams {
  /** Projects as stored in `.data/*-projects.json`, with keys in place of their texts. */
  projects?: ProjectData[];
  /** Translation function of the language to show. */
  t: TFunction;
}

/**
 * Gives each project its name and its kind in the language of `t`, read from the
 * `projects.names` and `projects.types` translations by its `nameKey` and `typeKey`. A text
 * missing in that language falls back to French, as every translation does.
 *
 * @returns The cards to show, in the order of `projects`, or none when `projects` is not a list.
 * An item that is not an object, or is a list, is left out. A key that is missing, blank, not a
 * string, inherited by every object (`constructor`) or in no translation gives an empty text: a
 * card without a name, or without a kind.
 *
 * @example
 * translateProjects({ projects: [{ id: 1, nameKey: 'chess', typeKey: 'webApp', … }], t });
 * // [{ id: 1, name: 'Chess game', type: 'Web application', … }] in English
 */
export function translateProjects({ projects, t }: TranslateProjectsParams): ProjectItemData[] {
  if (!Array.isArray(projects)) return [];

  return projects.filter(isObject).map(({ nameKey, typeKey, ...project }) => ({
    ...project,
    name: translateChild({ t, parentKey: PROJECT_NAMES_KEY, childKey: nameKey }),
    type: translateChild({ t, parentKey: PROJECT_TYPES_KEY, childKey: typeKey }),
  }));
}
