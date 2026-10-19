import styled, { css, th } from '@xstyled/styled-components';
import { Link } from 'react-router';

import { FORCED_COLORS_QUERY, HOVER_POINTER_QUERY } from '../../../theme/constants.ts';
import { fingerTargetCenteringOffset, fingerTargetSize } from '../../../theme/targets.styled.ts';
import { LINK_HEIGHT_PX, LINK_WIDTH_PX } from './constants.ts';

/* Space between the two links */
const linkGap = th.space(4);

/* Offset of an edge placed in the middle of the gap between the links, out of the link */
const halfGapOutside = css`calc(${linkGap} / -2)`;

export const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  padding: ${th.space(4)};
  gap: ${linkGap};
  border-radius: ${th.radius(30)};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a10')};
  background: ${th.color('shade-a35')};
  backdrop-filter: ${th('blurs.14')};
  -webkit-backdrop-filter: ${th('blurs.14')};
  box-shadow: ${th.shadow('card')};
  transition:
    box-shadow ${th.duration(300)} ${th.timingFunction('standard')},
    border-color ${th.duration(300)} ${th.timingFunction('standard')};

  @media ${HOVER_POINTER_QUERY} {
    &:hover {
      border-color: ${th.color('accent-a40')};
      box-shadow: ${th.shadow('accentHalo')};
    }
  }

  @media (min-width: ${th('screens.tablet')}) {
    flex-direction: column;
  }
`;

export const Indicator = styled.div<{ $index: number }>`
  position: absolute;
  top: ${th.space(4)};
  left: ${th.space(4)};
  box-sizing: border-box;
  width: ${LINK_WIDTH_PX}px;
  height: ${LINK_HEIGHT_PX}px;
  border-radius: ${th.radius(24)};
  background: ${th.color('accent-a35')};
  border: ${th.borderWidth('thin')} solid ${th.color('accent-a55')};
  box-shadow: ${th.shadow('accentGlowFaint')};
  transform: translateX(calc(${({ $index }) => $index} * (100% + ${linkGap})));
  transition: transform ${th.duration(350)} ${th.timingFunction('spring')};
  pointer-events: none;

  @media (min-width: ${th('screens.tablet')}) {
    transform: translateY(calc(${({ $index }) => $index} * (100% + ${linkGap})));
  }

  /* Forced colors mode removes its fill and its glow: a thicker border, in the color of a
     selection, still marks the active language */
  @media ${FORCED_COLORS_QUERY} {
    border: ${th.borderWidth('thick')} solid ${th.color('forced-active')};
  }
`;

/* A router link, since a LocalizedLink keeps the language of the current URL: each of these leads
   to its own */
export const LanguageLink = styled(Link)<{ $active: boolean }>`
  position: relative;
  z-index: ${th.zIndex('raised')};
  /* Centers its code, as a button does */
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${LINK_WIDTH_PX}px;
  height: ${LINK_HEIGHT_PX}px;
  border-radius: ${th.radius(24)};
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('bold')};
  letter-spacing: ${th.letterSpacing(8)};
  /* The inactive language stays dimmer, still 4.5:1 on the dark background */
  color: ${({ $active }) => ($active ? th.color('accent-foreground') : th.color('foreground-a55'))};
  transition: color ${th.duration(250)} ${th.timingFunction('standard')};

  /* Each link is smaller than a finger target, and too close to the other one for two centered
     targets: an empty box of that size catches the taps of each, from the middle of the gap
     between them outward, in a row on mobile */
  &::after {
    content: '';
    position: absolute;
    width: ${fingerTargetSize};
    height: ${fingerTargetSize};
  }

  &:first-of-type::after {
    inset: ${fingerTargetCenteringOffset} ${halfGapOutside} auto auto;
  }

  &:last-of-type::after {
    inset: ${fingerTargetCenteringOffset} auto auto ${halfGapOutside};
  }

  @media ${HOVER_POINTER_QUERY} {
    &:hover {
      color: ${({ $active }) =>
        $active ? th.color('accent-foreground') : th.color('foreground-a70')};
      /* As the buttons of the site grow */
      transform: scale(1.06);
    }
  }

  /* And in a column from tablet up */
  @media (min-width: ${th('screens.tablet')}) {
    &:first-of-type::after {
      inset: auto auto ${halfGapOutside} ${fingerTargetCenteringOffset};
    }

    &:last-of-type::after {
      inset: ${halfGapOutside} auto auto ${fingerTargetCenteringOffset};
    }
  }
`;
