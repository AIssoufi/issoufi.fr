import styled, { th } from '@xstyled/styled-components';

import { card, companyBlock, timelineRow } from '../timeline.styled';

/* ── Group wrapper — participates directly in Timeline ─────── */

export const GroupArticle = styled.section`
  ${companyBlock}
  padding-left: ${th.space(22)}; /* mobile: indent past the dot */

  @media (min-width: ${th('screens.tablet')}) {
    padding-left: 0;
  }
`;

/* ── Role list ─────────────────────────────────────────────── */

export const RolesList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${th.space(10)};
`;

/* ── Role item — each role is its own timeline row ─────────── */

export const RoleItem = styled.li`
  position: relative;
  ${timelineRow}

  /* mobile dot per role */
  &::before {
    content: '';
    position: absolute;
    left: -28px; /* 22px padding + 6px (half of 12px dot) */
    top: 14px;
    width: 8px;
    height: 8px;
    border-radius: ${th.radius('circle')};
    background: ${th.color('accent-a65')};
    border: ${th.borderWidth('thick')} solid ${th.color('foreground-a50')};
    z-index: ${th.zIndex('raised')};
  }

  @media (min-width: ${th('screens.tablet')}) {
    &::before {
      display: none;
    }
  }
`;

/* ── Role content — the card ────────────────────────────────── */

export const RoleContent = styled.div`
  min-width: 0;
  ${card}
  padding: ${th.space(14)} ${th.space(16)};

  @media (min-width: ${th('screens.tablet')}) {
    margin-left: ${th.space(20)};
  }
`;

export const RoleDetails = styled.div`
  font-size: ${th.fontSize(14)};
  font-weight: ${th.fontWeight('regular')};
  line-height: ${th.lineHeight(160)};
  margin-top: ${th.space(10)};
`;
