import styled, { th } from '@xstyled/styled-components';

import List from '../../components/List';
import Page from '../../components/Page';

import {
  lineWidth,
  mobileLineLeft,
  periodColumnWidth,
  widePeriodColumnWidth,
} from './timeline.styled';

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

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(44)};
  }
`;

/* ── Timeline grid: the list of the companies ──────────────── */

export const Timeline = styled(List)`
  position: relative;

  /* vertical line — mobile */
  &::before {
    content: '';
    position: absolute;
    left: ${mobileLineLeft};
    top: ${th.space(14)};
    bottom: ${th.space(14)};
    width: ${lineWidth};
    background: linear-gradient(
      to bottom,
      ${th.color('accent-a90')} 0%,
      ${th.color('accent-a35')} 75%,
      transparent 100%
    );
    border-radius: ${th.radius(1)};
  }

  /* vertical line — desktop (centered on the right edge of the period column) */
  @media (min-width: ${th('screens.tablet')}) {
    &::before {
      left: calc(${periodColumnWidth} - ${lineWidth} / 2);
    }
  }

  @media (min-width: ${th('screens.wide')}) {
    &::before {
      left: calc(${widePeriodColumnWidth} - ${lineWidth} / 2);
    }
  }
`;
