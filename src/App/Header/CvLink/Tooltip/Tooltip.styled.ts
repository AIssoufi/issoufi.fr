import styled, { css, keyframes, th } from '@xstyled/styled-components';

import type { TooltipPlacement } from './types';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

/* Holds the trigger and the bubble, so hovering either one keeps the tooltip open, and places the
   bubble against the trigger without adding any space around it */
export const Wrapper = styled.span`
  position: relative;
  display: inline-flex;
`;

/* Each placement centers the bubble on one side of the trigger, and stretches its bridge over the
   gap between them, so the pointer can move from the trigger onto the bubble without closing it */
const placementStyles = {
  left: css`
    top: 50%;
    right: calc(100% + ${th.space('tooltip-gap')});
    transform: translateY(-50%);

    &::before {
      top: 0;
      bottom: 0;
      left: 100%;
      width: ${th.space('tooltip-gap')};
    }
  `,
  top: css`
    bottom: calc(100% + ${th.space('tooltip-gap')});
    left: 50%;
    transform: translateX(-50%);

    &::before {
      left: 0;
      right: 0;
      top: 100%;
      height: ${th.space('tooltip-gap')};
    }
  `,
} satisfies Record<TooltipPlacement, unknown>;

export const Bubble = styled.span<BubbleProps>`
  display: ${({ $isOpen }) => ($isOpen ? 'block' : 'none')};
  position: absolute;
  z-index: ${th.zIndex('raised')};
  padding: ${th.space(6)} ${th.space(10)};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a10')};
  border-radius: ${th.radius('sm')};
  background-color: ${th.color('shade-a80')};
  backdrop-filter: ${th('blurs.14')};
  -webkit-backdrop-filter: ${th('blurs.14')};
  box-shadow: ${th.shadow('card')};
  color: ${th.color('foreground')};
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('medium')};
  letter-spacing: ${th.letterSpacing(2)};
  line-height: ${th.lineHeight(140)};
  white-space: nowrap;
  animation: ${fadeIn} ${th.duration(150)} ${th.timingFunction('standard')} both;

  &::before {
    content: '';
    position: absolute;
  }

  ${({ $placement }) => placementStyles[$placement]}
`;

interface BubbleProps {
  $placement: TooltipPlacement;
  $isOpen: boolean;
}
