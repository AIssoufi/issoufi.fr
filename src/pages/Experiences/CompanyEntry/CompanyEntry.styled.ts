import styled, { th } from '@xstyled/styled-components';

import { companyBlock, mobileContentIndent, timelineRow } from '../timeline.styled';

export const TimelineEntry = styled.li`
  ${companyBlock}
  ${timelineRow}
`;

export const TimelineContent = styled.div`
  min-width: 0;
  padding-left: ${mobileContentIndent};

  @media (min-width: ${th('screens.tablet')}) {
    padding-left: ${th.space(20)};
  }
`;
