import styled, { th } from '@xstyled/styled-components';

import { Page } from '../../App/App.styled';

import { companyBlock, timelineRow } from './timeline.styled';

export const ExperiencesPage = styled(Page)``;

export const PageHeader = styled.header`
  position: relative;
  z-index: ${th.zIndex('raisedMore')};
`;

export const PageTitle = styled.h1`
  font-size: ${th.fontSize(26)};
  font-weight: ${th.fontWeight('bold')};
  margin: 0;
  margin-bottom: ${th.space(20)};
  letter-spacing: ${th.letterSpacing('tight')};
  position: relative;
  z-index: ${th.zIndex('raisedMore')};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(40)};
  }
`;

/* ── Timeline grid ─────────────────────────────────────────── */

export const Timeline = styled.div`
  position: relative;

  /* vertical line — mobile */
  &::before {
    content: '';
    position: absolute;
    left: 5px;
    top: 14px;
    bottom: 14px;
    width: 2px;
    background: linear-gradient(
      to bottom,
      ${th.color('accent-a90')} 0%,
      ${th.color('accent-a35')} 75%,
      transparent 100%
    );
    border-radius: ${th.radius(1)};
  }

  /* vertical line — desktop (centered on the 90 px period column) */
  @media (min-width: ${th('screens.tablet')}) {
    &::before {
      left: 89px; /* 90px col − 1px to center the 2px line */
    }
  }
`;

export const TimelineEntry = styled.div`
  ${companyBlock}
  ${timelineRow}
`;

/* ── Content column ───────────────────────────────────────── */

export const TimelineContent = styled.div`
  min-width: 0;
  padding-left: ${th.space(22)}; /* mobile: indent past the dot */

  @media (min-width: ${th('screens.tablet')}) {
    padding-left: ${th.space(20)};
  }
`;

export const BulletList = styled.ul`
  list-style: none;
  margin: ${th.space(8)} 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${th.space(5)};
`;

export const BulletItem = styled.li`
  position: relative;
  padding-left: ${th.space(16)};
  font-size: ${th.fontSize(14)};
  line-height: ${th.lineHeight(155)};

  &::before {
    content: '›';
    position: absolute;
    left: 0;
    color: ${th.color('accent-soft-a65')};
    font-weight: ${th.fontWeight('bold')};
    font-size: ${th.fontSize(15)};
    line-height: ${th.lineHeight(145)};
  }
`;
