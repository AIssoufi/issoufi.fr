import styled, { th } from '@xstyled/styled-components';

import { timelineDot } from '../timeline.styled.ts';

export const Column = styled.div`
  /* hidden on mobile — card takes full width */
  display: none;

  @media (min-width: ${th('screens.tablet')}) {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-right: ${th.space(18)};
    padding-top: ${th.space(5)};
    position: relative;

    /* dot on the timeline line */
    &::after {
      ${timelineDot}
      right: ${th.space(-8)}; /* right edge 8px past the column, so centered on its right edge */
      top: ${th.space(5)};
    }
  }
`;

/* ── Role — dimmer, sized by its column ────────────────────── */

export const RoleColumn = styled(Column)`
  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(12)};
    letter-spacing: ${th.letterSpacing(2)};
    white-space: nowrap;
  }

  @media (min-width: ${th('screens.wide')}) {
    font-size: ${th.fontSize(14)};
  }
`;
