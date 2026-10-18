import styled, { th } from '@xstyled/styled-components';

export const Button = styled.button`
  position: relative;
  z-index: ${th.zIndex('header')};
  width: ${th.size('burger-icon')};
  height: ${th.size('burger-icon')};
  padding: 0;
  border: none;
  border-radius: ${th.radius('sm')};
  background: none;
  color: inherit;
  cursor: pointer;

  /* The global button style grows buttons on hover: the icon keeps its size, as it always did */
  &:hover {
    transform: none;
  }

  /* The soft accent keeps the ring visible on the dark page and on the open menu alike */
  &:focus-visible {
    outline: ${th.borderWidth('thick')} solid ${th.color('accent-soft')};
    outline-offset: ${th.space(2)};
  }

  > svg {
    display: block;
  }

  /* Fits the compact header of a short screen */
  @media (max-height: ${th('screenHeights.short')}) {
    width: ${th.size('burger-icon-compact')};
    height: ${th.size('burger-icon-compact')};
  }

  @media (min-width: ${th('screens.tablet')}) {
    display: none;
  }
`;
