import styled, { th } from '@xstyled/styled-components';

import Page from '../../components/Page';

export const ProjectsPage = styled(Page)`
  padding-left: 0;
  padding-right: 0;

  /* The gutters of Page */
  @media (min-width: ${th('screens.tablet')}) {
    padding-left: ${th.space('page')};
    padding-right: ${th.space('page')};
  }
`;

// The design shows only the section titles, so the page title is read by screen readers alone:
// a box of one pixel, clipped and out of the flow, that changes nothing on screen
export const PageTitle = styled.h1`
  position: absolute;
  width: ${th.size(1)};
  height: ${th.size(1)};
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
