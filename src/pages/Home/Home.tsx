import { useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ParticleField } from './ParticleField';
import { SplitWords } from './SplitWords';
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
  const cursorPos = useRef({ x: -100, y: -100 });
  const cursorTarget = useRef({ x: -100, y: -100 });
  const cursorRaf = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cursorTarget.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);

    const animate = () => {
      const cp = cursorPos.current;
      const ct = cursorTarget.current;
      cp.x += (ct.x - cp.x) * 0.1;
      cp.y += (ct.y - cp.y) * 0.1;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cp.x - 20}px, ${cp.y - 20}px)`;
      }
      cursorRaf.current = requestAnimationFrame(animate);
    };
    cursorRaf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(cursorRaf.current);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!contentRef.current) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      contentRef.current.style.transform = `translate(${dx * -10}px, ${dy * -7}px)`;
    };
    const onLeave = () => {
      if (!contentRef.current) return;
      contentRef.current.style.transition = 'transform 0.9s cubic-bezier(0.23, 1, 0.32, 1)';
      contentRef.current.style.transform = '';
      setTimeout(() => {
        if (contentRef.current) contentRef.current.style.transition = '';
      }, 900);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const handleMagnetMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.4;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.4;
    el.style.transition = 'transform 0.1s ease';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
  }, []);

  const handleMagnetLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transition = 'transform 0.7s cubic-bezier(0.23, 1, 0.32, 1)';
    e.currentTarget.style.transform = '';
  }, []);

  return (
    <HomePage $backgroundImage="/home.jpeg">
      <ParticleField />
      <CursorGlow ref={cursorRef} />
      <Content ref={contentRef}>
        <Main>
          <Title>
            <SplitWords startIndex={0}>{t('home.title1')}</SplitWords>
            <br />
            {t('home.title2Pre')}
            <SplitWords startIndex={3}>UX</SplitWords>
            {t('home.title2Mid')}
            <SplitWords startIndex={4}>UI</SplitWords>
            {t('home.title2Post')}
          </Title>
          <Subtitle>{t('home.subtitle')}</Subtitle>
        </Main>
        <ButtonContainer>
          <MagneticWrapper
            onMouseMove={handleMagnetMove}
            onMouseLeave={handleMagnetLeave}
          >
            <Btn
              as={Link}
              to="/projects"
              $callToAction
            >
              {t('home.cta')}
            </Btn>
          </MagneticWrapper>
          <MagneticWrapper
            onMouseMove={handleMagnetMove}
            onMouseLeave={handleMagnetLeave}
          >
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
