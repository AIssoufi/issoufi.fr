import styled from 'styled-components';

import { Page } from '../../App/App.styled';

import { th } from '@xstyled/styled-components';

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
  position: relative;
  margin-bottom: ${th.space(20)};

  /* dot — mobile */
  &::before {
    content: '';
    position: absolute;
    left: -1px; /* centered on the line at left: 5px (5 - 6 = -1) */
    top: 18px;
    width: 12px;
    height: 12px;
    border-radius: ${th.radius('circle')};
    background: ${th.color('accent-a85')};
    border: ${th.borderWidth('thick')} solid ${th.color('foreground-a80')};
    box-shadow: ${th.shadow('accentGlow')};
    z-index: ${th.zIndex('raised')};
  }

  /* desktop: two-column grid */
  @media (min-width: ${th('screens.tablet')}) {
    display: grid;
    grid-template-columns: 90px 1fr;

    /* hide mobile dot */
    &::before {
      display: none;
    }
  }
`;

/* ── Period column (desktop only) ─────────────────────────── */

export const TimelinePeriod = styled.div`
  /* hidden on mobile — card takes full width */
  display: none;

  @media (min-width: ${th('screens.tablet')}) {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-right: ${th.space(18)};
    padding-top: ${th.space(5)};
    position: relative;

    /* dot */
    &::after {
      content: '';
      position: absolute;
      right: -6px; /* right edge at 90px + 6px, so centered at 90px */
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: ${th.radius('circle')};
      background: ${th.color('accent-a85')};
      border: ${th.borderWidth('thick')} solid ${th.color('foreground-a80')};
      box-shadow: ${th.shadow('accentGlow')};
      z-index: ${th.zIndex('raised')};
    }
  }
`;

export const PeriodStart = styled.span`
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('bold')};
  color: ${th.color('accent-soft-a95')};
  letter-spacing: ${th.letterSpacing(2)};
  line-height: ${th.lineHeight(150)};
  white-space: nowrap;
  text-align: right;
`;

export const PeriodSep = styled.span`
  font-size: ${th.fontSize(11)};
  color: ${th.color('foreground-a25')};
  line-height: ${th.lineHeight(120)};
`;

export const PeriodEnd = styled.span`
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-a55')};
  letter-spacing: ${th.letterSpacing(2)};
  line-height: ${th.lineHeight(150)};
  white-space: nowrap;
  text-align: right;
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
