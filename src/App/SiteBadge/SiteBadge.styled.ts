import styled, { th } from '@xstyled/styled-components';

import { BUTTON_HEIGHT_PX, BUTTON_WIDTH_PX } from '../constants';
import { frostedPill } from '../frostedPill.styled';

/* Pages keep the site-badge-clearance space under their content (Page, src/components), so that
   their end scrolls above the badge: change it with the offset or the height of the badge */
export const Container = styled.footer`
  ${frostedPill}
  position: fixed;
  left: ${th.space(20)};
  bottom: ${th.space(20)};
  z-index: ${th.zIndex('overlay')};
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${th.space(8)};
  padding: ${th.space(4)} ${th.space(14)} ${th.space(4)} ${th.space(4)};
`;

export const GitHubLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${BUTTON_WIDTH_PX}px;
  height: ${BUTTON_HEIGHT_PX}px;
  border-radius: ${th.radius(24)};
  color: ${th.color('foreground-a65')};
  transition: color ${th.duration(250)} ${th.timingFunction('standard')};

  &:hover {
    color: ${th.color('foreground')};
  }

  /* The round mark fills the height of the button */
  svg {
    width: ${BUTTON_HEIGHT_PX}px;
    height: ${BUTTON_HEIGHT_PX}px;
  }
`;

export const Version = styled.p`
  margin: 0;
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('medium')};
  letter-spacing: ${th.letterSpacing(4)};
  color: ${th.color('foreground-a65')};
  white-space: nowrap;
`;
