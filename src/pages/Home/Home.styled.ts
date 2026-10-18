import styled, { keyframes, th } from '@xstyled/styled-components';

import Page from '../../components/Page';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
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
  width: 40px;
  height: 40px;
  border-radius: ${th.radius('circle')};
  border: ${th.borderWidth('thin')} solid ${th.color('accent-a65')};
  background: radial-gradient(circle, ${th.color('accent-a10')} 0%, transparent 70%);
  pointer-events: none;
  z-index: ${th.zIndex('cursor')};
  will-change: transform;
`;

export const Content = styled.div`
  position: relative;
  z-index: ${th.zIndex('raised')};
  display: flex;
  flex-direction: column;
  align-items: center;
  will-change: transform;
`;

export const Main = styled.main`
  text-align: center;
  max-width: 640px;
  animation: ${float} ${th.duration(7000)} ${th.timingFunction('inOut')} infinite;
  animation-delay: ${th.duration(500)};
`;

export const Title = styled.h1`
  font-size: ${th.fontSize(18)};
  font-weight: ${th.fontWeight('regular')};
  line-height: ${th.lineHeight(170)};
  letter-spacing: ${th.letterSpacing(1)};
  margin: 0 0 ${th.space(12)};
  animation: ${fadeUp} ${th.duration(900)} ${th.timingFunction('standard')} both;

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(22)};
  }
`;

export const Subtitle = styled.p`
  font-size: ${th.fontSize(16)};
  font-weight: ${th.fontWeight('regular')};
  color: ${th.color('foreground-secondary')};
  line-height: ${th.lineHeight(160)};
  margin: 0 0 ${th.space(4)};
  animation: ${fadeUp} ${th.duration(900)} ${th.timingFunction('standard')} ${th.duration(200)} both;

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(18)};
  }
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* Mobile: both buttons take the width of the widest one */
  align-items: stretch;
  padding-top: ${th.space(56)};
  gap: ${th.space(14)};
  animation: ${fadeUp} ${th.duration(900)} ${th.timingFunction('standard')} ${th.duration(400)} both;

  @media (min-width: ${th('screens.tablet')}) {
    align-items: center;
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
    min-width: 240px;
    padding: ${th.space(13)} ${th.space(32)};
  }

  &:hover {
    color: ${th.color('foreground')};
    box-shadow: ${props =>
      props.$callToAction ? th.shadow('accentGlowStrong') : th.shadow('lightGlow')};
  }

  ${props =>
    !props.$callToAction &&
    `
    &:hover {
      background-color: ${th.color('foreground')};
      color: ${th.color('background')};
      border-color: ${th.color('foreground')};
    }
  `}
`;
