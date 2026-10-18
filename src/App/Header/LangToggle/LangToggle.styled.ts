import styled, { th } from '@xstyled/styled-components';

import { BUTTON_HEIGHT_PX, BUTTON_WIDTH_PX } from '../../constants';
import { frostedPill } from '../../frostedPill.styled';

export const Wrapper = styled.div`
  ${frostedPill}
  position: relative;
  display: flex;
  flex-direction: row;
  padding: ${th.space(4)};
  gap: ${th.space(4)};

  @media (min-width: ${th('screens.tablet')}) {
    position: fixed;
    right: ${th.space(20)};
    top: 50%;
    transform: translateY(-50%);
    z-index: ${th.zIndex('overlay')};
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
  font-size: ${th.fontSize(11)};
  font-weight: ${th.fontWeight('bold')};
  letter-spacing: ${th.letterSpacing(8)};
  color: ${({ $active }) => ($active ? th.color('accent-soft') : th.color('foreground-a35'))};
  transition: color ${th.duration(250)} ${th.timingFunction('standard')};

  &:hover {
    color: ${({ $active }) => ($active ? th.color('accent-soft') : th.color('foreground-a70'))};
  }
`;
