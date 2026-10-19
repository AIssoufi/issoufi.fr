import type { Language } from '../../../../i18n/types';

/**
 * URL of the CV of the site owner in each language, a PDF of `public/` that `pnpm cv`
 * (`scripts/cv/`) generates from the content of the site in that language. Each one is written as
 * one whole string, so the standalone build finds it and makes it relative to its page.
 */
export const CV_URLS = {
  fr: '/CV - Adam Issoufi.pdf',
  en: '/CV - Adam Issoufi (EN).pdf',
} as const satisfies Record<Language, string>;
