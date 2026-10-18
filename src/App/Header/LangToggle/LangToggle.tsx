import { useTranslation } from 'react-i18next';

import { LANGS, LANGUAGE_NAMES } from './constants';
import { Btn, Indicator, Wrapper } from './LangToggle.styled';

/**
 * FR/EN switch that changes the i18next language, with an indicator sliding under the active
 * language. Below the `tablet` breakpoint it sits horizontally in its parent's flow, the header
 * row, so it never covers the page; from `tablet` up it floats vertically on the right edge of
 * the screen. The choice is not persisted: each visit starts in French.
 *
 * Screen readers announce a group labelled in the active language, and each button with its
 * language's own name, pronounced in that language, and its pressed state. When the language
 * is not one of the toggle's, no button is pressed.
 */
const LangToggle = () => {
  const { i18n, t } = useTranslation();
  const activeIndex = LANGS.indexOf(i18n.language as (typeof LANGS)[number]);
  const isSupportedLanguage = activeIndex >= 0;

  return (
    <Wrapper
      role="group"
      aria-label={t('langToggle.label')}
    >
      <Indicator $index={isSupportedLanguage ? activeIndex : 0} />
      {LANGS.map(lang => {
        const isActive = i18n.language === lang;

        return (
          <Btn
            key={lang}
            type="button"
            lang={lang}
            aria-label={LANGUAGE_NAMES[lang]}
            aria-pressed={isActive}
            $active={isActive}
            onClick={() => i18n.changeLanguage(lang)}
          >
            {lang.toUpperCase()}
          </Btn>
        );
      })}
    </Wrapper>
  );
};

export default LangToggle;
