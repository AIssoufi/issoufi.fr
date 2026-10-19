import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';

import VisuallyHidden from '../../../components/VisuallyHidden/index.ts';
import { useIsHydrated } from '../../../hooks/useIsHydrated/index.ts';
import { useUrlLanguage } from '../../../hooks/useUrlLanguage/index.ts';
import { LANGUAGES } from '../../../i18n/constants.ts';
import { storeLanguage } from '../../../i18n/storage.ts';
import type { Language } from '../../../i18n/types.ts';
import { localizePath } from '../../../i18n/utils.ts';
import { LANGUAGE_NAMES } from './constants.ts';
import { getRenderedPagePath, isPlainClick } from './utils.ts';
import { Indicator, LanguageLink, Wrapper } from './LangToggle.styled.ts';

/** Parameters of the click handler of a language link. */
interface SelectLanguageParams {
  /** Click on the link. */
  event: MouseEvent<HTMLAnchorElement>;
  /** Language of the link. */
  language: Language;
}

/**
 * FR/EN switch whose links lead to the same page in each language, `/projects` to `/en/projects`
 * and back, keeping the query string and the fragment, with an indicator sliding under the
 * language of the URL. They are plain links, which work without JavaScript and which crawlers
 * follow; with it, the router follows them without reloading the page, and the texts follow the
 * new URL (see `UrlLanguage` in `src/App`). Below the `tablet` breakpoint it sits horizontally in
 * its parent's flow, the header row, so it never covers the page; from `tablet` up it is vertical,
 * and the header floats it on the right edge of the screen. The chosen language is also stored, so
 * the root URL opens in it on the next visit (see `src/i18n/storage.ts`); the language still
 * changes, without being remembered, when the browser blocks the storage. The link of the active
 * language stays on the page, where a click only stores the choice. Must be rendered inside a
 * router.
 *
 * The page that the build renders knows no query string nor fragment, nor the path that its not
 * found page answers, whose links lead to the home of each language: the links get them once the
 * browser has hydrated the page (see `useIsHydrated`).
 *
 * Screen readers announce a group labelled in the active language, and each link with its visible
 * code then its language's own name, "FR – Français", pronounced in that language, and the active
 * one as the current one. The name starts with the visible text, so that a voice control user who
 * says "EN" finds the link (WCAG 2.5.3, Label in Name).
 */
const LangToggle = () => {
  const { t } = useTranslation();
  const { pathname, search, hash } = useLocation();
  const isHydrated = useIsHydrated();
  const activeLanguage = useUrlLanguage();
  const indicatorIndex = LANGUAGES.indexOf(activeLanguage);
  // The build knows the page, not the URL that the visitor typed
  const currentPath = isHydrated ? pathname : getRenderedPagePath(pathname);
  const queryAndFragment = isHydrated ? `${search}${hash}` : '';

  const selectLanguage = ({ event, language }: SelectLanguageParams) => {
    storeLanguage(language);
    // The router would load the current page again, and move the focus to its heading
    const staysOnPage = language === activeLanguage && isPlainClick(event);
    if (staysOnPage) event.preventDefault();
  };

  return (
    <Wrapper
      role="group"
      aria-label={t('langToggle.label')}
    >
      <Indicator $index={indicatorIndex} />
      {LANGUAGES.map(lang => {
        const isActive = activeLanguage === lang;
        const ariaCurrent = isActive ? 'true' : undefined;

        return (
          <LanguageLink
            key={lang}
            to={`${localizePath({ path: currentPath, language: lang })}${queryAndFragment}`}
            lang={lang}
            hrefLang={lang}
            aria-current={ariaCurrent}
            $active={isActive}
            onClick={event => selectLanguage({ event, language: lang })}
          >
            {/* The space stays out of the hidden text, whose edge spaces some engines drop from
                the name, as jsdom does: the name reads "FR – Français" in each of them */}
            {lang.toUpperCase()} <VisuallyHidden>– {LANGUAGE_NAMES[lang]}</VisuallyHidden>
          </LanguageLink>
        );
      })}
    </Wrapper>
  );
};

export default LangToggle;
