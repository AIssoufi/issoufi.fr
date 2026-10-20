import styled, { css, th } from '@xstyled/styled-components';

import { HOVER_POINTER_QUERY, NO_SCRIPT_QUERY } from '../../../theme/constants.ts';
import { NO_SCRIPT_MOBILE_MEDIA_QUERY } from '../constants.ts';

/* The box of the button, and of the links that stand for it without JavaScript */
const control = css`
  position: relative;
  z-index: ${th.zIndex('header')};
  width: ${th.size('burger-icon')};
  height: ${th.size('burger-icon')};
  border-radius: ${th.radius('sm')};
  color: inherit;

  /* The soft accent keeps the ring visible on the dark page and on the open menu alike */
  &:focus-visible {
    outline: ${th.borderWidth('thick')} solid ${th.color('accent-soft')};
    outline-offset: ${th.space(2)};
  }

  /* Fits the compact header of a short screen */
  @media (max-height: ${th('screenHeights.short')}) {
    width: ${th.size('burger-icon-compact')};
    height: ${th.size('burger-icon-compact')};
  }
`;

export const Button = styled.button`
  ${control}
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;

  /* The global button style grows buttons on hover: the icon keeps its size, as it always did */
  @media ${HOVER_POINTER_QUERY} {
    &:hover {
      transform: none;
    }
  }

  /* Does nothing without JavaScript: the links stand for it */
  @media ${NO_SCRIPT_QUERY} {
    display: none;
  }

  @media (min-width: ${th('screens.tablet')}) {
    display: none;
  }
`;

/* Shown while the URL does not name the menu, which follows the links in the page */
export const OpenLink = styled.a`
  ${control}
  display: none;

  @media ${NO_SCRIPT_MOBILE_MEDIA_QUERY} {
    display: block;

    &:has(~ :target) {
      display: none;
    }
  }
`;

/* Shown in place of the other link while the URL names the menu, which is then open */
export const CloseLink = styled.a`
  ${control}
  display: none;

  @media ${NO_SCRIPT_MOBILE_MEDIA_QUERY} {
    &:has(~ :target) {
      display: block;
    }
  }
`;
