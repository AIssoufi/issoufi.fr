import type { LANGUAGES } from './constants';

/** Code of one of the site's {@link LANGUAGES}, as i18next and the `lang` attribute use it. */
export type Language = (typeof LANGUAGES)[number];
