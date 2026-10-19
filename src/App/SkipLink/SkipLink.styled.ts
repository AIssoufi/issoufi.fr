import styled, { th } from '@xstyled/styled-components';

// Clipped to nothing until it has the focus, so it changes nothing on screen nor under the pointer,
// then over the top left corner of the header, which it covers until the next Tab
export const Link = styled.a`
  position: fixed;
  top: ${th.space(16)};
  left: ${th.space('page')};
  z-index: ${th.zIndex('skipLink')};
  padding: ${th.space(10)} ${th.space(20)};
  border: ${th.borderWidth('thin')} solid ${th.color('accent-a55')};
  border-radius: ${th.radius('pill')};
  background-color: ${th.color('background')};
  font-size: ${th.fontSize(15)};
  letter-spacing: ${th.letterSpacing(3)};
  white-space: nowrap;
  clip-path: inset(50%);

  &:focus {
    clip-path: none;
  }
`;
