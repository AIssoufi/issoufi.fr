import styled, { th } from '@xstyled/styled-components';

export const Canvas = styled.canvas`
  position: fixed;
  inset: 0;
  z-index: ${th.zIndex('base')};
  pointer-events: none;
`;
