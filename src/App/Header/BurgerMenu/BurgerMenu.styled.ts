import styled, { th } from '@xstyled/styled-components';

export const Container = styled.div<{ $isOpen: boolean }>`
  cursor: pointer;
  position: relative;
  z-index: ${th.zIndex('header')};
  width: ${th.size('burger-icon')};
  height: ${th.size('burger-icon')};

  > svg {
    display: block;
  }

  @media (min-width: ${th('screens.tablet')}) {
    display: none;
  }
`;
