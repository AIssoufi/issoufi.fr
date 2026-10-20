import { DEFAULT_LANGUAGE } from '../../../../i18n/constants.ts';
import { isLanguage } from '../../../../i18n/utils.ts';
import { CV_URLS } from './constants.ts';

/**
 * Picks the URL of the CV in a language, so that each language's CV link downloads the CV written
 * in it.
 *
 * @param language - Language of the page, e.g. `i18n.resolvedLanguage`. A value that is not one
 * of the `LANGUAGES` counts as the default language.
 *
 * @example
 * getCvUrl('en'); // '/CV - Adam Issoufi (EN).pdf'
 * getCvUrl('de'); // '/CV - Adam Issoufi.pdf'
 */
export const getCvUrl = (language: unknown): string =>
  CV_URLS[isLanguage(language) ? language : DEFAULT_LANGUAGE];
