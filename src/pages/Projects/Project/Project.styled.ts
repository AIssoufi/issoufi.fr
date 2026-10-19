import styled, { css, keyframes, th } from '@xstyled/styled-components';

import List from '../../../components/List';
import { CARD_PERSPECTIVE_PX, LIKE_ANIMATION_MS } from './constants';

const heartPop = keyframes`
  0%   { transform: scale(1); }
  25%  { transform: scale(1.7); }
  50%  { transform: scale(0.8); }
  75%  { transform: scale(1.3); }
  100% { transform: scale(1); }
`;

// Space around each card, which the list takes off the page gutter to line the cards up with it
const cardMargin = th.space('project-card-margin');

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

  /* At the first or the last page, the button stays focusable but does nothing, and shows it */
  &[aria-disabled='true'] {
    opacity: 0.4;
    cursor: default;
  }

  &:hover:not([aria-disabled='true']) {
    background-color: ${th.color('accent')};
    border-color: ${th.color('accent')};
    transform: none;
  }
`;

export const ProjectGrid = styled(List)<{ $displayAll: boolean }>`
  display: flex;
  flex-direction: row;
  /* A full row fills the width anyway: a shorter one, such as the last page of the row or the last
     row of "Show all", starts on the left, with its cards in the columns of the full ones */
  justify-content: flex-start;
  align-items: flex-start;
  max-width: 100vw;
  overflow-x: auto;
  /* The page gutter less the margin of the cards, in the row as in "Show all", so that the cards
     have the same width in both. The row scrolls across it, up to the edges of the screen. */
  padding-left: calc(${th.space('page')} - ${cardMargin});
  padding-right: calc(${th.space('page')} - ${cardMargin});

  @media (min-width: ${th('screens.tablet')}) {
    padding-left: 0;
    padding-right: 0;
  }

  /* "Show all" keeps the cards of the row and wraps them onto as many rows as they need */
  ${props =>
    props.$displayAll &&
    css`
      flex-wrap: wrap;
      row-gap: ${th.space(5)};
    `}
`;

export const ProjectItem = styled.li`
  /* Box covered by the stretched link of the title */
  position: relative;
  display: flex;
  flex-direction: column;
  margin: ${cardMargin};
  /* One column on a phone: the card fills the width between the page gutters, and the next card of
     the row starts in the right one, which shows that the row scrolls */
  flex: 0 0 calc(100% - 2 * ${cardMargin});
  transition:
    transform ${th.duration(150)} ${th.timingFunction('standard')},
    box-shadow ${th.duration(150)} ${th.timingFunction('standard')};
  will-change: transform;
  transform-style: preserve-3d;

  &:not(:hover) {
    transform: perspective(${CARD_PERSPECTIVE_PX}px) rotateX(0deg) rotateY(0deg) translateY(0px);
    transition: transform ${th.duration(400)} ${th.timingFunction('standard')};
  }

  /* Then as many columns as fit, which share the width of the section, in the row as in "Show
     all": the next card of the row is out of view once the section has no gutter on the right */
  @media (min-width: ${th('screens.two-project-columns')}) {
    flex: 0 0 calc(50% - 2 * ${cardMargin});
  }

  /* A third less a hair, so that rounding never pushes the third card onto a new row */
  @media (min-width: ${th('screens.three-project-columns')}) {
    flex: 0 0 calc(33.333% - 2 * ${cardMargin});
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
  /* A round button around the heart alone, since it shows no count */
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${th.size(32)};
  height: ${th.size(32)};
  padding: 0;
  border-radius: ${th.radius('circle')};
  border: ${th.borderWidth('thin')} solid
    ${props => (props.$liked ? th.color('accent-a60') : th.color('foreground-a20'))};
  /* Dark enough in every state for the heart to keep 3:1 even over a white thumbnail */
  background: ${props => (props.$liked ? th.color('accent-backdrop') : th.color('shade-a45'))};
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
    stroke: ${props => (props.$liked ? th.color('accent-foreground') : th.color('foreground'))};
    fill: ${props => (props.$liked ? th.color('accent-foreground') : 'transparent')};
    transition:
      stroke ${th.duration(200)},
      fill ${th.duration(200)};
    ${props =>
      props.$animating &&
      css`
        animation: ${heartPop} ${LIKE_ANIMATION_MS}ms ${th.timingFunction('standard')} forwards;
      `}
  }

  &:hover {
    border-color: ${th.color('accent-a70')};
    background: ${th.color('accent-backdrop')};
    transform: scale(1.06);

    > svg {
      stroke: ${th.color('accent-foreground')};
    }
  }

  &:active {
    transform: scale(0.93);
  }

  /* Forced colors mode turns the background of the button into the color of the page, and keeps
     the colors of the heart, which could then vanish: it draws the heart in the colors of its
     palette, filled in the color of a selection once liked */
  @media (forced-colors: active) {
    > svg,
    &:hover > svg {
      stroke: ${props => (props.$liked ? th.color('forced-active') : th.color('forced-icon'))};
      fill: ${props => (props.$liked ? th.color('forced-active') : 'transparent')};
    }
  }
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
