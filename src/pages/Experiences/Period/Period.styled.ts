import styled, { th } from '@xstyled/styled-components';

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
