import styled, { th } from '@xstyled/styled-components';

import DownloadIcon from './icons/download.svg?react';

export const Link = styled.a`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  color: ${th.color('foreground')};
`;

export const Icon = styled(DownloadIcon)`
  margin-right: ${th.space('icon-gap')};
`;
