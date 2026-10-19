import styled, { css, keyframes, th } from '@xstyled/styled-components';

import Page from '../../components/Page/index.ts';
import { theme } from '../../theme/index.ts';
import { HOVER_POINTER_QUERY, REDUCED_MOTION_QUERY } from '../../theme/constants.ts';
import { CURSOR_GLOW_RADIUS_PX, CURSOR_GLOW_START } from './constants.ts';
import { getCursorGlowTransform } from './utils.ts';

// Keyframes have no theme context, so they read the theme object rather than the th helpers
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-${theme.space[10]}); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(${theme.space[20]}); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const HomePage = styled(Page)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const CursorGlow = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: ${CURSOR_GLOW_RADIUS_PX * 2}px;
  height: ${CURSOR_GLOW_RADIUS_PX * 2}px;
  border-radius: ${th.radius('circle')};
  border: ${th.borderWidth('thin')} solid ${th.color('accent-a65')};
  background: radial-gradient(circle, ${th.color('accent-a10')} 0%, transparent 70%);
  pointer-events: none;
  z-index: ${th.zIndex('cursor')};
  /* Off the screen, where useCursorFollower starts it, in the page of the build too, which shows
     it before any script runs */
  transform: ${getCursorGlowTransform(CURSOR_GLOW_START)};
  will-change: transform;

  /* With reduced motion, useCursorFollower never moves it to the pointer */
  @media ${REDUCED_MOTION_QUERY} {
    display: none;
  }
`;

export const Content = styled.div`
  position: relative;
  z-index: ${th.zIndex('raised')};
  display: flex;
  flex-direction: column;
  align-items: center;
  will-change: transform;
`;

export const Intro = styled.div`
  text-align: center;
  /* Sets the em of its largest width, the size of the title words, which grows with the screen */
  font-size: ${th.fontSize('hero-title')};
  max-width: ${th.size('hero-intro')};
  animation: ${float} ${th.duration(7000)} ${th.timingFunction('inOut')} infinite;
  animation-delay: ${th.duration(500)};
`;

export const Title = styled.h1`
  font-size: ${th.fontSize('hero-text')};
  font-weight: ${th.fontWeight('regular')};
  line-height: ${th.lineHeight(170)};
  letter-spacing: ${th.letterSpacing(1)};
  margin: 0 0 ${th.space(12)};
  animation: ${fadeUp} ${th.duration(900)} ${th.timingFunction('standard')} both;

  /* A phone held sideways shows the buttons under the title without scrolling */
  @media (max-height: ${th('screenHeights.short')}) {
    margin-bottom: ${th.space(4)};
  }
`;

/* Each line of the title is a block of its own, which the browser balances apart: Chrome balances
   no block that a forced line break splits */
export const TitleLine = styled.span`
  display: block;
`;

/* The three long words of the job title wrap as they did before the title was balanced: on two
   lines, one of them holds a single word either way, and balancing them would only move
   "full-stack" to the second line on a desktop screen */
export const JobTitleLine = styled(TitleLine)`
  text-wrap: wrap;
`;

export const NoWrap = styled.span`
  white-space: nowrap;
`;

export const Subtitle = styled.p`
  font-size: ${th.fontSize('hero-subtitle')};
  font-weight: ${th.fontWeight('regular')};
  color: ${th.color('foreground-secondary')};
  line-height: ${th.lineHeight(160)};
  /* Lines of even lengths, as the title above it has, rather than a word alone on the last one */
  text-wrap: balance;
  margin: 0 0 ${th.space(4)};
  animation: ${fadeUp} ${th.duration(900)} ${th.timingFunction('standard')} ${th.duration(200)} both;
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* Mobile: both buttons take the width of the widest one */
  align-items: stretch;
  padding-top: ${th.space('hero-actions')};
  gap: ${th.space(14)};
  animation: ${fadeUp} ${th.duration(900)} ${th.timingFunction('standard')} ${th.duration(400)} both;

  @media (min-width: ${th('screens.tablet')}) {
    align-items: center;
  }

  @media (max-height: ${th('screenHeights.short')}) {
    gap: ${th.space(8)};
  }
`;

export const MagneticWrapper = styled.div`
  display: flex;
  will-change: transform;
`;

export const Btn = styled.a<{ $callToAction?: boolean }>`
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  /* Mobile: a label too long for the screen wraps, centered, instead of widening the page */
  text-align: center;
  font-size: ${th.fontSize(14)};
  font-weight: ${th.fontWeight('medium')};
  letter-spacing: ${th.letterSpacing(5)};
  text-transform: uppercase;
  border-radius: ${th.radius('pill')};
  border: ${th.borderWidth('thin')} solid
    ${props => (props.$callToAction ? th.color('accent') : th.color('foreground-a40'))};
  padding: ${th.space(13)} ${th.space(20)};
  background-color: ${props => (props.$callToAction ? th.color('accent') : 'transparent')};
  color: ${th.color('foreground')};
  transition-property: background-color, color, border-color, box-shadow;
  transition-duration: ${th.duration('base')};

  @media (min-width: ${th('screens.tablet')}) {
    width: max-content;
    /* 240px for the label, plus the side paddings and the borders, which border-box includes */
    min-width: calc(${th.size(240)} + 2 * ${th.space(32)} + 2 * ${th.borderWidth('thin')});
    padding: ${th.space(13)} ${th.space(32)};
  }

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(16)};
  }

  @media ${HOVER_POINTER_QUERY} {
    &:hover {
      color: ${th.color('foreground')};
      box-shadow: ${props =>
        props.$callToAction ? th.shadow('accentGlowStrong') : th.shadow('lightGlow')};
    }
  }

  ${props =>
    !props.$callToAction &&
    css`
      @media ${HOVER_POINTER_QUERY} {
        &:hover {
          background-color: ${th.color('foreground')};
          color: ${th.color('background')};
          border-color: ${th.color('foreground')};
        }
      }
    `}
`;
