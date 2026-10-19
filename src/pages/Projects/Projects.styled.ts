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
