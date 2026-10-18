import styled, { css, keyframes, th } from '@xstyled/styled-components';

import List from '../../../components/List';
import { theme } from '../../../theme';
import { CARD_PERSPECTIVE_PX } from './constants';

const heartPop = keyframes`
  0%   { transform: scale(1); }
  25%  { transform: scale(1.7); }
  50%  { transform: scale(0.8); }
  75%  { transform: scale(1.3); }
  100% { transform: scale(1); }
`;

// Keyframes have no theme context, so they read the theme object rather than the th helpers
const countBump = keyframes`
  0%   { transform: translateY(0); opacity: 1; }
  40%  { transform: translateY(-${theme.space[6]}); opacity: 0; }
  41%  { transform: translateY(${theme.space[6]}); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

// Space around each card, which the "Show all" rows take off their padding to line the cards up
const cardMargin = th.space(5);

// Width of a card in the row of three, less the margins on both of its sides
const cardBasis = css`calc(33.333% - 2 * ${cardMargin})`;

export const Section = styled.section`
  height: max-content;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  margin-bottom: ${th.space(30)};
`;

export const SectionHeader = styled.header`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: ${th.space(10)};
  padding-left: ${th.space('page')};
  padding-right: ${th.space('page')};

  @media (min-width: ${th('screens.tablet')}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-left: 0;
    padding-right: 0;
  }
`;

export const SectionTitle = styled.h2`
  font-size: ${th.fontSize(26)};
  font-weight: ${th.fontWeight('bold')};
  margin: 0;
  margin-bottom: ${th.space(10)};
  letter-spacing: ${th.letterSpacing('tight')};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(40)};
  }
`;

export const SectionControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${th.space(8)};
`;

export const CtrlItem = styled.button`
  order: 3;
  height: ${th.size(32)};
  border-radius: ${th.radius('pill')};
  padding: 0 ${th.space(14)};
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('medium')};
  letter-spacing: ${th.letterSpacing(3)};
  white-space: nowrap;
  color: ${th.color('foreground')};
  background-color: ${th.color('surface')};
  border: ${th.border('card')};
  backdrop-filter: ${th('blurs.8')};
  -webkit-backdrop-filter: ${th('blurs.8')};
  transition-property: background-color, border-color, color;
  transition-duration: ${th.duration('base')};

  &:hover {
    background-color: ${th.color('accent')};
    border-color: ${th.color('accent')};
    color: ${th.color('foreground')};
    cursor: pointer;
    transform: none;
  }
`;

export const IconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${th.size(36)};
  height: ${th.size(36)};
  padding: 0;
  border: ${th.border('card')};
  border-radius: ${th.radius('circle')};
  color: ${th.color('foreground')};
  background-color: ${th.color('surface')};
  backdrop-filter: ${th('blurs.8')};
  -webkit-backdrop-filter: ${th('blurs.8')};
  transition-property: background-color, border-color;
  transition-duration: ${th.duration('base')};
  flex-shrink: 0;
  cursor: pointer;

  > svg {
    width: ${th.size(16)};
    height: ${th.size(16)};
    display: block;
  }

  &:hover {
    background-color: ${th.color('accent')};
    border-color: ${th.color('accent')};
    transform: none;
  }
`;

export const ProjectGrid = styled(List)<{ $displayAll: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  max-width: 100vw;
  overflow-x: auto;

  /* "Show all" keeps the cards of the row and wraps them onto as many rows as they need, starting
     each row on the left so that the last one lines up with the columns above */
  ${props =>
    props.$displayAll &&
    css`
      flex-wrap: wrap;
      justify-content: flex-start;
      row-gap: ${th.space(5)};
      padding-left: calc(${th.space('page')} - ${cardMargin});
      padding-right: calc(${th.space('page')} - ${cardMargin});

      @media (min-width: ${th('screens.tablet')}) {
        padding-left: 0;
        padding-right: 0;
      }
    `}
`;

export const ProjectItem = styled.li<{ $displayAll?: boolean }>`
  /* Box covered by the stretched link of the title */
  position: relative;
  display: flex;
  flex-direction: column;
  margin: ${cardMargin};
  flex: 0 0 ${cardBasis};
  min-width: ${th.size(260)};
  /* Keeps content-box: the 260px minimum and the flex basis leave out the page gutter that pads
     the first and last cards, so the gutter widens them instead of narrowing their content */
  box-sizing: content-box;
  transition:
    transform ${th.duration(150)} ${th.timingFunction('standard')},
    box-shadow ${th.duration(150)} ${th.timingFunction('standard')};
  will-change: transform;
  transform-style: preserve-3d;

  &:not(:hover) {
    transform: perspective(${CARD_PERSPECTIVE_PX}px) rotateX(0deg) rotateY(0deg) translateY(0px);
    transition: transform ${th.duration(400)} ${th.timingFunction('standard')};
  }

  &:first-child {
    padding-left: ${props => (props.$displayAll ? '0' : th.space('page'))};
  }

  &:last-child {
    padding-right: ${props => (props.$displayAll ? '0' : th.space('page'))};
  }

  @media (min-width: ${th('screens.tablet')}) {
    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
    }
  }
`;

export const ImageContainer = styled.header`
  height: ${th.size(222)};
  border-radius: ${th.radius('md')};
  overflow: hidden;
  position: relative;
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a8')};

  &::before {
    content: '';
    position: absolute;
    background: linear-gradient(
      180deg,
      ${th.color('shade-a35')} 0%,
      ${th.color('shade-a0')} 50%,
      ${th.color('shade-a50')} 100%
    );
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: ${th.zIndex('raised')};
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      ${th.color('foreground-a18')} 0%,
      ${th.color('foreground-a6')} 30%,
      transparent 65%
    );
    opacity: 0;
    transition: opacity ${th.duration(200)} ${th.timingFunction('standard')};
    z-index: ${th.zIndex('raisedMore')};
    pointer-events: none;
  }

  ${ProjectItem}:hover &::after {
    opacity: 1;
  }
`;

export const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  transition-property: object-position;
  transition-duration: ${th.duration('base')};

  ${ProjectItem}:hover & {
    object-position: center;
  }
`;

export const LikeButton = styled.button<{ $liked: boolean; $animating: boolean }>`
  position: absolute;
  top: ${th.space(10)};
  right: ${th.space(10)};
  z-index: ${th.zIndex('raisedMost')};
  display: flex;
  align-items: center;
  gap: ${th.space(6)};
  padding: ${th.space(5)} ${th.space(11)} ${th.space(5)} ${th.space(8)};
  border-radius: ${th.radius('pill')};
  border: ${th.borderWidth('thin')} solid
    ${props => (props.$liked ? th.color('accent-a60') : th.color('foreground-a20'))};
  background: ${props => (props.$liked ? th.color('accent-a25') : th.color('shade-a45'))};
  backdrop-filter: ${th('blurs.10')};
  -webkit-backdrop-filter: ${th('blurs.10')};
  cursor: pointer;
  transition:
    border-color ${th.duration(200)},
    background ${th.duration(200)},
    transform ${th.duration(150)};

  > svg {
    width: ${th.size(15)};
    height: ${th.size(15)};
    flex-shrink: 0;
    stroke: ${props => (props.$liked ? th.color('accent') : th.color('foreground-a85'))};
    fill: ${props => (props.$liked ? th.color('accent') : 'transparent')};
    transition:
      stroke ${th.duration(200)},
      fill ${th.duration(200)};
    ${props =>
      props.$animating &&
      css`
        animation: ${heartPop} ${th.duration(450)} ${th.timingFunction('standard')} forwards;
      `}
  }

  &:hover {
    border-color: ${th.color('accent-a70')};
    background: ${th.color('accent-a20')};
    transform: scale(1.06);

    > svg {
      stroke: ${th.color('accent')};
    }
  }

  &:active {
    transform: scale(0.93);
  }
`;

export const LikeCount = styled.span<{ $liked: boolean; $animating: boolean }>`
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('semibold')};
  color: ${props => (props.$liked ? th.color('accent') : th.color('foreground-a85'))};
  transition: color ${th.duration(200)};
  min-width: ${th.size(12)};
  text-align: center;
  ${props =>
    props.$animating &&
    css`
      animation: ${countBump} ${th.duration(350)} ${th.timingFunction('standard')} forwards;
    `}
`;

export const ProjectInfo = styled.div`
  margin-top: ${th.space(10)};
  padding-left: ${th.space(4)};
`;

export const ProjectName = styled.div`
  font-size: ${th.fontSize(16)};
  font-weight: ${th.fontWeight('bold')};
  letter-spacing: ${th.letterSpacing(1)};
  margin-bottom: ${th.space(3)};
`;

// Its ::after covers the whole card, so that a click anywhere on it opens the project, while the
// like button stays outside the link
export const ProjectLink = styled.a`
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: ${th.radius('md')};
    /* Above the thumbnail gradient, which would catch the clicks, and under the like button */
    z-index: ${th.zIndex('raisedMore')};
  }

  /* The keyboard focus ring goes around the whole card that the link covers, not its text */
  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: auto;
  }
`;

export const ProjectType = styled.div`
  font-size: ${th.fontSize(13)};
  color: ${th.color('foreground-muted')};
`;

export const ProjectTools = styled.div`
  font-size: ${th.fontSize(13)};
  color: ${th.color('foreground-muted')};
`;
