import styled, { th } from '@xstyled/styled-components';

// A box of one pixel, clipped and out of the flow, that changes nothing on screen: out of the
// flow, it takes no cell of a grid nor any room in a flex container either
export const Hidden = styled.span`
  position: absolute;
  width: ${th.size(1)};
  height: ${th.size(1)};
  margin: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
