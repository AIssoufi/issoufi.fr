import styled, { th } from '@xstyled/styled-components';

import { timelineDot } from '../timeline.styled';

export const Column = styled.div`
  /* hidden on mobile — card takes full width */
  display: none;

  @media (min-width: ${th('screens.tablet')}) {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-right: ${th.space(18)};
    padding-top: ${th.space(5)};
    position: relative;

    /* dot on the timeline line */
    &::after {
      ${timelineDot}
      right: -8px; /* right edge at 90px + 8px, so centered at 90px */
      top: ${th.space(5)};
    }
  }
`;

/* ── Job — each line sets its own size ─────────────────────── */

export const Start = styled.span`
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('bold')};
  color: ${th.color('accent-soft-a95')};
  letter-spacing: ${th.letterSpacing(2)};
  line-height: ${th.lineHeight(150)};
  white-space: nowrap;
  text-align: right;
`;

export const Separator = styled.span`
  font-size: ${th.fontSize(11)};
  color: ${th.color('foreground-a25')};
  line-height: ${th.lineHeight(120)};
`;

export const End = styled.span`
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-a55')};
  letter-spacing: ${th.letterSpacing(2)};
  line-height: ${th.lineHeight(150)};
  white-space: nowrap;
  text-align: right;
`;

/* ── Role — smaller and dimmer, sized by its column ────────── */

export const RoleColumn = styled(Column)`
  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(10)};
    letter-spacing: ${th.letterSpacing(2)};
    white-space: nowrap;
  }
`;

export const RoleStart = styled.span`
  font-weight: ${th.fontWeight('bold')};
  color: ${th.color('accent-soft-a85')};
  line-height: ${th.lineHeight(150)};
`;

export const RoleSeparator = styled.span`
  color: ${th.color('foreground-a20')};
  line-height: ${th.lineHeight(120)};
`;

export const RoleEnd = styled.span`
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-a40')};
  line-height: ${th.lineHeight(150)};
`;
