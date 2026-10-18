import styled, { th } from '@xstyled/styled-components';

import { PORTRAIT_PHOTO_MEDIA_QUERY } from '../../utils/pages';

export const Main = styled.main<{ $backgroundImage: string; $portraitBackgroundImage: string }>`
  padding: ${th.space('page-top')} ${th.space('page')} 0;
  position: relative;
  grid-area: main;

  /* The language toggle, the CV button and the GitHub icon float on the right edge from tablet up */
  @media (min-width: ${th('screens.tablet')}) {
    padding-right: ${th.space('floating-controls-room')};
  }

  &::before {
    content: '';
    display: block;
    position: fixed;
    z-index: ${th.zIndex('pageBackground')};
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-image: ${props => props.$backgroundImage};
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;

    /* The same media query as the preload of the app, so no screen downloads both versions */
    @media ${PORTRAIT_PHOTO_MEDIA_QUERY} {
      background-image: ${props => props.$portraitBackgroundImage};
    }
  }

  &::after {
    content: '';
    display: block;
    position: fixed;
    z-index: ${th.zIndex('behind')};
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: ${th.color('shade-a80')};
  }
`;
