import styled, { th } from '@xstyled/styled-components';

import List from '../../../components/List';
import {
  card,
  companyBlock,
  mobileContentIndent,
  mobileLineCenter,
  timelineRow,
} from '../timeline.styled';

/* ── Group item — an item of the Timeline list ─────────────── */

export const GroupItem = styled.li`
  ${companyBlock}
  padding-left: ${mobileContentIndent};

  @media (min-width: ${th('screens.tablet')}) {
    padding-left: 0;
  }
`;

/* ── Role list ─────────────────────────────────────────────── */

export const RolesList = styled(List)`
  display: flex;
  flex-direction: column;
  gap: ${th.space(10)};
`;

/* ── Role item — each role is its own timeline row ─────────── */

export const RoleItem = styled.li`
  position: relative;
  ${timelineRow}

  /* mobile dot per role, centered on the line, which runs left of the group's indent */
  &::before {
    content: '';
    position: absolute;
    left: calc(${mobileLineCenter} - ${mobileContentIndent});
    transform: translateX(-50%);
    top: ${th.space(14)};
    width: ${th.size(12)};
    height: ${th.size(12)};
    border-radius: ${th.radius('circle')};
    background: ${th.color('accent-a65')};
    border: ${th.borderWidth('thick')} solid ${th.color('foreground-a50')};
    z-index: ${th.zIndex('raised')};
  }

  /* the company dot already marks the first role, at the same height */
  &:first-child::before {
    display: none;
  }

  @media (min-width: ${th('screens.tablet')}) {
    &::before {
      display: none;
    }
  }
`;

/* ── Role content — the card ────────────────────────────────── */

export const RoleContent = styled.article`
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
