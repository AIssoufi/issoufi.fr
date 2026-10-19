import styled, { css, th } from '@xstyled/styled-components';

import { HOVER_POINTER_QUERY } from '../../../theme/constants';
import { MIDDLE_BAR_OPEN_ROTATION_DEG, TOP_BAR_OPEN_ROTATION_DEG } from './constants';

export const Button = styled.button`
  position: relative;
  z-index: ${th.zIndex('header')};
  width: ${th.size('burger-icon')};
  height: ${th.size('burger-icon')};
  padding: 0;
  border: none;
  border-radius: ${th.radius('sm')};
  background: none;
  color: inherit;
  cursor: pointer;

  /* The global button style grows buttons on hover: the icon keeps its size, as it always did */
  @media ${HOVER_POINTER_QUERY} {
    &:hover {
      transform: none;
    }
  }

  /* The soft accent keeps the ring visible on the dark page and on the open menu alike */
  &:focus-visible {
    outline: ${th.borderWidth('thick')} solid ${th.color('accent-soft')};
    outline-offset: ${th.space(2)};
  }

  /* Fits the compact header of a short screen */
  @media (max-height: ${th('screenHeights.short')}) {
    width: ${th.size('burger-icon-compact')};
    height: ${th.size('burger-icon-compact')};
  }

  @media (min-width: ${th('screens.tablet')}) {
    display: none;
  }
`;

/* Opening: the outer bars slide onto the middle one, then the top and middle bars turn into a
   cross, while the bottom one hides behind them */
const openSlideDuration = th.duration(200);
const openTurnDuration = th.duration(700);

const openingTransition = css`
  transition:
    translate ${openSlideDuration} ${th.timingFunction('inOut')},
    rotate ${openTurnDuration} ${th.timingFunction('standard')} ${openSlideDuration},
    opacity 0s ${openSlideDuration};
`;

/* Closing: the cross turns back first, then the bars slide apart */
const closeTurnDuration = th.duration(300);
const closeSlideDuration = th.duration(100);

const closingTransition = css`
  transition:
    rotate ${closeTurnDuration} ${th.timingFunction('standard')},
    translate ${closeSlideDuration} ${th.timingFunction('inOut')} ${closeTurnDuration},
    opacity 0s ${closeTurnDuration};
`;

interface BarProps {
  $isOpen: boolean;
}

/* Centered in the button: the three bars overlap until they are moved apart */
const Bar = styled.span<BarProps>`
  position: absolute;
  inset: 0;
  width: ${th.size('burger-bar')};
  height: ${th.size('burger-bar-thickness')};
  margin: auto;
  border-radius: ${th.radius('pill')};
  background: currentColor;
  ${({ $isOpen }) => ($isOpen ? openingTransition : closingTransition)}
`;

export const TopBar = styled(Bar)`
  translate: 0 ${th.space('-burger-bar-gap')};

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      translate: none;
      rotate: ${TOP_BAR_OPEN_ROTATION_DEG}deg;
    `}
`;

export const MiddleBar = styled(Bar)`
  ${({ $isOpen }) =>
    $isOpen &&
    css`
      rotate: ${MIDDLE_BAR_OPEN_ROTATION_DEG}deg;
    `}
`;

export const BottomBar = styled(Bar)`
  translate: 0 ${th.space('burger-bar-gap')};

  ${({ $isOpen }) =>
    $isOpen &&
    css`
      translate: none;
      opacity: 0;
    `}
`;
