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
  JobTitleLine,
  MagneticWrapper,
  NoWrap,
  Subtitle,
  Title,
  TitleLine,
} from './Home.styled';
import { splitLastWord } from './utils';

/**
 * Home page: the animated job title and subtitle, with links to the projects and experiences
 * pages, over a particle background. A glow follows the cursor, the content shifts slightly with
 * it, and the buttons are pulled toward it; a tap moves none of them, since a finger hovers
 * nothing. Listeners and animation frames are removed on unmount. The links lead to the pages in
 * the language of the current URL. Must be rendered inside a router.
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
  const passionStart = splitLastWord(t('home.title2Pre'));
  const passionMiddle = splitLastWord(t('home.title2Mid'));

  return (
    <HomePage backgroundPhoto={HOME_PAGE.backgroundPhoto}>
      <ParticleField />
      <CursorGlow ref={cursorRef} />
      <Content ref={contentRef}>
        <Intro>
          <Title>
            <JobTitleLine>
              <SplitWords startIndex={0}>{jobTitle}</SplitWords>
            </JobTitleLine>
            {/* The browser may wrap on either side of an animated word, even next to a no-break
                space, so the words around it that belong to it, as in "l’UX" and "l’UI Design",
                stay on its line by their own style */}
            <TitleLine>
              {passionStart.leading}
              <NoWrap>
                {passionStart.lastWord}
                <SplitWords startIndex={jobTitleWordCount}>UX</SplitWords>
              </NoWrap>
              {passionMiddle.leading}
              <NoWrap>
                {passionMiddle.lastWord}
                <SplitWords startIndex={jobTitleWordCount + 1}>UI</SplitWords>
                {t('home.title2Post')}
              </NoWrap>
            </TitleLine>
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
