import { useLocation } from 'react-router';

import type { Language } from '../../i18n/types';
import { getPathLanguage } from '../../i18n/utils';

/**
 * Returns the language of the current URL, read from its prefix (see `getPathLanguage`): the
 * language the page is shown in, which the links and the language toggle follow. Must be called
 * inside a router.
 *
 * @example
 * const language = useUrlLanguage(); // 'en' at /en/projects, 'fr' at /projects
 */
export const useUrlLanguage = (): Language => getPathLanguage(useLocation().pathname);
