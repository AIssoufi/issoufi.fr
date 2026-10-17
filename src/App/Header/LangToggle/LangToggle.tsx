import { useTranslation } from 'react-i18next';
import { Btn, Indicator, Wrapper } from './LangToggle.styled';

const LANGS = ['fr', 'en'] as const;

/**
 * FR/EN switch that changes the i18next language, with an indicator sliding under the active
 * language. Below the `tablet` breakpoint it sits horizontally in its parent's flow, the header
 * row, so it never covers the page; from `tablet` up it floats vertically on the right edge of
 * the screen. The choice is not persisted: each visit starts in French.
 */
const LangToggle = () => {
  const { i18n } = useTranslation();
  const activeIndex = LANGS.indexOf(i18n.language as (typeof LANGS)[number]);

  return (
    <Wrapper>
      <Indicator $index={activeIndex < 0 ? 0 : activeIndex} />
      {LANGS.map(lang => (
        <Btn
          key={lang}
          $active={i18n.language === lang}
          onClick={() => i18n.changeLanguage(lang)}
        >
          {lang.toUpperCase()}
        </Btn>
      ))}
    </Wrapper>
  );
};

export default LangToggle;
