import { DEFAULT_LANGUAGE } from '../../../i18n/constants';
import { isLanguage } from '../../../i18n/utils';
import { CV_URLS } from './constants';

/**
 * Picks the URL of the CV in a language, so that each language's CV button downloads the CV
 * written in it.
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
