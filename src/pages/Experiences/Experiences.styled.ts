import styled from 'styled-components';

import { Page } from '../../App/App.styled';

export const ExperiencesPage = styled(Page)``;

export const PageHeader = styled.header`
  position: relative;
  z-index: 2;
`;

export const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  margin: 0;
  margin-bottom: 20px;
  letter-spacing: -0.01em;
  position: relative;
  z-index: 2;

  @media (min-width: 50em) {
    font-size: 40px;
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
      rgba(139, 49, 104, 0.9) 0%,
      rgba(139, 49, 104, 0.35) 75%,
      transparent 100%
    );
    border-radius: 1px;
  }

  /* vertical line — desktop (centered on the 90 px period column) */
  @media (min-width: 50em) {
    &::before {
      left: 89px; /* 90px col − 1px to center the 2px line */
    }
  }
`;

export const TimelineEntry = styled.div`
  position: relative;
  margin-bottom: 20px;

  /* dot — mobile */
  &::before {
    content: '';
    position: absolute;
    left: -1px; /* centered on the line at left: 5px (5 - 6 = -1) */
    top: 18px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(139, 49, 104, 0.85);
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 10px rgba(139, 49, 104, 0.55);
    z-index: 1;
  }

  /* desktop: two-column grid */
  @media (min-width: 50em) {
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

  @media (min-width: 50em) {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-right: 18px;
    padding-top: 5px;
    position: relative;

    /* dot */
    &::after {
      content: '';
      position: absolute;
      right: -6px; /* right edge at 90px + 6px, so centered at 90px */
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(139, 49, 104, 0.85);
      border: 2px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 0 10px rgba(139, 49, 104, 0.55);
      z-index: 1;
    }
  }
`;

export const PeriodStart = styled.span`
  font-size: 12px;
  font-weight: 700;
  color: rgba(212, 160, 192, 0.95);
  letter-spacing: 0.02em;
  line-height: 1.5;
  white-space: nowrap;
  text-align: right;
`;

export const PeriodSep = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  line-height: 1.2;
`;

export const PeriodEnd = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.02em;
  line-height: 1.5;
  white-space: nowrap;
  text-align: right;
`;

/* ── Content column ───────────────────────────────────────── */

export const TimelineContent = styled.div`
  min-width: 0;
  padding-left: 22px; /* mobile: indent past the dot */

  @media (min-width: 50em) {
    padding-left: 20px;
  }
`;

export const BulletList = styled.ul`
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

export const BulletItem = styled.li`
  position: relative;
  padding-left: 16px;
  font-size: 14px;
  line-height: 1.55;

  &::before {
    content: '›';
    position: absolute;
    left: 0;
    color: rgba(212, 160, 192, 0.65);
    font-weight: 700;
    font-size: 15px;
    line-height: 1.45;
  }
`;
