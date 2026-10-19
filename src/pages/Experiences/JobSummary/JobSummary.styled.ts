import styled, { th } from '@xstyled/styled-components';

import { LOGO_SIZE_PX } from './constants';

export const Summary = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const EntityLogo = styled.img`
  height: ${LOGO_SIZE_PX}px;
  width: ${LOGO_SIZE_PX}px;
  object-fit: cover;
  border-radius: ${th.radius('sm')};
  border: ${th.border('card')};
`;

export const JobInfo = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: ${th.space(12)};
`;

export const JobName = styled.h3`
  margin: 0;
  font-size: ${th.fontSize(15)};
  font-weight: ${th.fontWeight('bold')};
  letter-spacing: ${th.letterSpacing(1)};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(17)};
  }

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(19)};
  }
`;

export const RoleName = styled.h3`
  margin: 0;
  font-size: ${th.fontSize(14)};
  font-weight: ${th.fontWeight('semibold')};
  letter-spacing: ${th.letterSpacing(1)};
  line-height: ${th.lineHeight(140)};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(15)};
  }

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(17)};
  }
`;

export const JobDetails = styled.div`
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-secondary')};
  margin-top: ${th.space(2)};

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(15)};
  }
`;

/* The period, then the duration, on one line while they fit. Each one keeps its own top margin,
   which also spaces the duration from the period when it wraps under it */
export const JobTiming = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: ${th.space(8)};
`;

/* Shown below the tablet breakpoint only: from it, the period column of the timeline shows it */
export const JobPeriod = styled.span`
  margin-top: ${th.space(4)};
  font-size: ${th.fontSize(12)};
  letter-spacing: ${th.letterSpacing(2)};
  line-height: ${th.lineHeight(150)};

  @media (min-width: ${th('screens.tablet')}) {
    display: none;
  }
`;

export const JobDuration = styled.div`
  display: inline-flex;
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-secondary')};
  background: ${th.color('foreground-a5')};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a10')};
  border-radius: ${th.radius(20)};
  padding: ${th.space(2)} ${th.space(9)};
  margin-top: ${th.space(4)};
  width: fit-content;

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(14)};
  }
`;
