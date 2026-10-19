import styled, { css, th } from '@xstyled/styled-components';

/* Size of each line of the period of a job, larger from the wide breakpoint, with the other texts
   of the page */
const jobLineSize = css`
  font-size: ${th.fontSize(12)};

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(14)};
  }
`;

/* ── Job — each line sets its own size ─────────────────────── */

export const Start = styled.span`
  ${jobLineSize}
  font-weight: ${th.fontWeight('bold')};
  color: ${th.color('accent-soft-a95')};
  letter-spacing: ${th.letterSpacing(2)};
  line-height: ${th.lineHeight(150)};
  white-space: nowrap;
  text-align: right;
`;

export const Separator = styled.span`
  ${jobLineSize}
  color: ${th.color('foreground-a25')};
  line-height: ${th.lineHeight(120)};
`;

export const End = styled.span`
  ${jobLineSize}
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-a55')};
  letter-spacing: ${th.letterSpacing(2)};
  line-height: ${th.lineHeight(150)};
  white-space: nowrap;
  text-align: right;
`;

/* ── Role — dimmer, sized by its column ────────────────────── */

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
  color: ${th.color('foreground-a55')};
  line-height: ${th.lineHeight(150)};
`;

/* ── Inline — the colors of a job, on one line, sized by its parent ── */

export const InlineStart = styled.span`
  font-weight: ${th.fontWeight('bold')};
  color: ${th.color('accent-soft-a95')};
  white-space: nowrap;
`;

export const InlineSeparator = styled.span`
  color: ${th.color('foreground-a25')};
`;

export const InlineEnd = styled.span`
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-a55')};
  white-space: nowrap;
`;
