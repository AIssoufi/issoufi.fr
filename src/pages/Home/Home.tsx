import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import LocalizedLink from '../../components/LocalizedLink';
import { HOME_PAGE } from '../../utils/pages';
import { ParticleField } from './ParticleField';
import { SplitWords } from './SplitWords';
import { useCursorFollower } from './hooks/useCursorFollower';
import { useMagneticHover } from './hooks/useMagneticHover';
import { useParallax } from './hooks/useParallax';
import {
  Btn,
  ButtonContainer,
  Content,
  CursorGlow,
  HomePage,
  Intro,
  MagneticWrapper,
  Subtitle,
  Title,
} from './Home.styled';

/**
 * Home page: the animated job title and subtitle, with links to the projects and experiences
 * pages, over a particle background. A glow follows the cursor, the content shifts slightly with
 * it, and the buttons are pulled toward it. Listeners and animation frames are removed on unmount.
 * The links lead to the pages in the language of the current URL. Must be rendered inside a router.
 */
export const Home = () => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const magneticHover = useMagneticHover();

  useCursorFollower(cursorRef);
  useParallax(contentRef);

  const jobTitle = t('home.title1');
  // The "UX" and "UI" words continue the shimmer sequence of the job title's words
  const jobTitleWordCount = jobTitle.split(' ').length;

  return (
    <HomePage backgroundPhoto={HOME_PAGE.backgroundPhoto}>
      <ParticleField />
      <CursorGlow ref={cursorRef} />
      <Content ref={contentRef}>
        <Intro>
          <Title>
            <SplitWords startIndex={0}>{jobTitle}</SplitWords>
            <br />
            {t('home.title2Pre')}
            <SplitWords startIndex={jobTitleWordCount}>UX</SplitWords>
            {t('home.title2Mid')}
            <SplitWords startIndex={jobTitleWordCount + 1}>UI</SplitWords>
            {t('home.title2Post')}
          </Title>
          <Subtitle>{t('home.subtitle')}</Subtitle>
        </Intro>
        <ButtonContainer>
          <MagneticWrapper {...magneticHover}>
            <Btn
              as={LocalizedLink}
              to="/projects"
              $callToAction
            >
              {t('home.cta')}
            </Btn>
          </MagneticWrapper>
          <MagneticWrapper {...magneticHover}>
            <Btn
              as={LocalizedLink}
              to="/experiences"
            >
              {t('home.secondary')}
            </Btn>
          </MagneticWrapper>
        </ButtonContainer>
      </Content>
    </HomePage>
  );
};
