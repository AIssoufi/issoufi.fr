import styled, { th } from '@xstyled/styled-components';

import Page from '../Page';

export const StatusPageMain = styled(Page)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* As much room under the message as the page keeps above it, so it sits in the middle */
  padding-bottom: ${th.space(16)};
`;
