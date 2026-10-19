import styled, { th } from '@xstyled/styled-components';

import { HOVER_POINTER_QUERY } from '../../../theme/constants';
import { BUTTON_HEIGHT_PX, BUTTON_WIDTH_PX } from './constants';

export const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  padding: ${th.space(4)};
  gap: ${th.space(4)};
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
  width: ${BUTTON_WIDTH_PX}px;
  height: ${BUTTON_HEIGHT_PX}px;
  border-radius: ${th.radius(24)};
  background: ${th.color('accent-a35')};
  border: ${th.borderWidth('thin')} solid ${th.color('accent-a55')};
  box-shadow: ${th.shadow('accentGlowFaint')};
  transform: translateX(calc(${({ $index }) => $index} * (100% + ${th.space(4)})));
  transition: transform ${th.duration(350)} ${th.timingFunction('spring')};
  pointer-events: none;

  @media (min-width: ${th('screens.tablet')}) {
    transform: translateY(calc(${({ $index }) => $index} * (100% + ${th.space(4)})));
  }

  /* Forced colors mode removes its fill and its glow: a thicker border, in the color of a
     selection, still marks the active language */
  @media (forced-colors: active) {
    border: ${th.borderWidth('thick')} solid ${th.color('forced-active')};
  }
`;

export const Btn = styled.button<{ $active: boolean }>`
  position: relative;
  z-index: ${th.zIndex('raised')};
  background: none;
  border: none;
  cursor: pointer;
  width: ${BUTTON_WIDTH_PX}px;
  height: ${BUTTON_HEIGHT_PX}px;
  border-radius: ${th.radius(24)};
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('bold')};
  letter-spacing: ${th.letterSpacing(8)};
  /* The inactive language stays dimmer, still 4.5:1 on the dark background */
  color: ${({ $active }) => ($active ? th.color('accent-foreground') : th.color('foreground-a55'))};
  transition: color ${th.duration(250)} ${th.timingFunction('standard')};

  @media ${HOVER_POINTER_QUERY} {
    &:hover {
      color: ${({ $active }) =>
        $active ? th.color('accent-foreground') : th.color('foreground-a70')};
    }
  }
`;
