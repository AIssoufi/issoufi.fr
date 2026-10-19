import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { useUrlLanguage } from '../../../hooks/useUrlLanguage';
import { LANGUAGES } from '../../../i18n/constants';
import { storeLanguage } from '../../../i18n/storage';
import type { Language } from '../../../i18n/types';
import { localizePath } from '../../../i18n/utils';
import { LANGUAGE_NAMES } from './constants';
import { Btn, Indicator, Wrapper } from './LangToggle.styled';

/**
 * FR/EN switch that goes to the same page in the other language, `/projects` to `/en/projects`
 * and back, keeping the query string and the fragment, with an indicator sliding under the
 * language of the URL. The texts follow the new URL (see `UrlLanguage` in `src/App`). Below the
 * `tablet` breakpoint it sits horizontally in its parent's flow, the header row, so it never
 * covers the page; from `tablet` up it is vertical, and the header floats it on the right edge of
 * the screen. The chosen language is also stored, so the root URL opens in it on the next visit
 * (see `src/i18n/storage.ts`); the language still changes, without being remembered, when the
 * browser blocks the storage. Must be rendered inside a router.
 *
 * Screen readers announce a group labelled in the active language, and each button with its
 * language's own name, pronounced in that language, and its pressed state.
 */
const LangToggle = () => {
  const { t } = useTranslation();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const activeLanguage = useUrlLanguage();
  const indicatorIndex = LANGUAGES.indexOf(activeLanguage);

  const selectLanguage = (language: Language) => {
    storeLanguage(language);
    const isOtherLanguage = language !== activeLanguage;
    if (isOtherLanguage) navigate(`${localizePath({ path: pathname, language })}${search}${hash}`);
  };

  return (
    <Wrapper
      role="group"
      aria-label={t('langToggle.label')}
    >
      <Indicator $index={indicatorIndex} />
      {LANGUAGES.map(lang => {
        const isActive = activeLanguage === lang;

        return (
          <Btn
            key={lang}
            type="button"
            lang={lang}
            aria-label={LANGUAGE_NAMES[lang]}
            aria-pressed={isActive}
            $active={isActive}
            onClick={() => selectLanguage(lang)}
          >
            {lang.toUpperCase()}
          </Btn>
        );
      })}
    </Wrapper>
  );
};

export default LangToggle;
