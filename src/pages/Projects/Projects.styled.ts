import styled from 'styled-components';

import { Page } from '../../App/App.styled';

import { th } from '@xstyled/styled-components';

export const ProjectsPage = styled(Page)`
  padding-left: 0;
  padding-right: 0;

  @media (min-width: ${th('screens.tablet')}) {
    padding-left: ${th.space('page')};
    padding-right: ${th.space('page')};
  }
`;
