import styled from 'styled-components';

import { th } from '@xstyled/styled-components';

export const Container = styled.div<{ $isOpen: boolean }>`
  cursor: pointer;
  position: relative;
  z-index: ${th.zIndex('header')};

  > svg {
    height: 50px !important;
    width: 50px !important;
    display: block;
  }

  @media (min-width: ${th('screens.tablet')}) {
    display: none;
  }
`;
