import type { TFunction } from 'i18next';

import { translateKey } from '../../i18n/utils.ts';
import { isNonBlankString } from '../../utils/strings.ts';
import type { ProjectItemData } from './Project/types.ts';
import { PROJECT_NAMES_KEY, PROJECT_TYPES_KEY } from './constants.ts';
import type { ProjectData } from './types.ts';

/** Parameters of {@link translateChild}. */
interface TranslateChildParams {
  /** Translation function of the language to show. */
  t: TFunction;
  /** Translation key of the group of texts, e.g. `projects.names`. */
  parentKey: string;
  /** Key of the text in its group, as written in the JSON data, so of any type. */
  childKey: unknown;
}

/** Text of a key of a group of translations, or an empty text when no translation has it. */
const translateChild = ({ t, parentKey, childKey }: TranslateChildParams): string =>
  // A key of the JSON data names a text of its group only as a non-blank string
  isNonBlankString(childKey) ? translateKey({ t, key: `${parentKey}.${childKey}` }) : '';

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
