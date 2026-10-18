import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '../../../i18n/constants';
import { storeLanguage } from '../../../i18n/storage';
import type { Language } from '../../../i18n/types';
import { isLanguage } from '../../../i18n/utils';
import { LANGUAGE_NAMES } from './constants';
import { Btn, Indicator, Wrapper } from './LangToggle.styled';

/**
 * FR/EN switch that changes the i18next language, with an indicator sliding under the active
 * language. Below the `tablet` breakpoint it sits horizontally in its parent's flow, the header
 * row, so it never covers the page; from `tablet` up it floats vertically on the right edge of
 * the screen. The chosen language is stored, so a reload or the next visit starts in it (see
 * `src/i18n/storage.ts`); it still applies, without being remembered, when the browser blocks the
 * storage.
 *
 * Screen readers announce a group labelled in the active language, and each button with its
 * language's own name, pronounced in that language, and its pressed state. When the language
 * is not one of the toggle's, no button is pressed.
 */
const LangToggle = () => {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.language;
  const indicatorIndex = isLanguage(activeLanguage) ? LANGUAGES.indexOf(activeLanguage) : 0;

  const selectLanguage = (language: Language) => {
    storeLanguage(language);
    i18n.changeLanguage(language);
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
