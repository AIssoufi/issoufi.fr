import { useRef } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import { ParticleField } from './ParticleField';
import { SplitWords } from './SplitWords';
import { BACKGROUND_IMAGE_URL } from './constants';
import { useCursorFollower } from './hooks/useCursorFollower';
import { useMagneticHover } from './hooks/useMagneticHover';
import { useParallax } from './hooks/useParallax';
import {
  Btn,
  ButtonContainer,
  Content,
  CursorGlow,
  HomePage,
  MagneticWrapper,
  Main,
  Subtitle,
  Title,
} from './Home.styled';

/**
 * Home page: the animated job title and subtitle, with links to the projects and experiences
 * pages, over a particle background. A glow follows the cursor, the content shifts slightly with
 * it, and the buttons are pulled toward it. Listeners and animation frames are removed on unmount.
 * Must be rendered inside a router.
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
    <HomePage $backgroundImage={BACKGROUND_IMAGE_URL}>
      <ParticleField />
      <CursorGlow ref={cursorRef} />
      <Content ref={contentRef}>
        <Main>
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
        </Main>
        <ButtonContainer>
          <MagneticWrapper {...magneticHover}>
            <Btn
              as={Link}
              to="/projects"
              $callToAction
            >
              {t('home.cta')}
            </Btn>
          </MagneticWrapper>
          <MagneticWrapper {...magneticHover}>
            <Btn
              as={Link}
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
