import styled, { th } from '@xstyled/styled-components';

import { HOVER_POINTER_QUERY } from '../../../theme/constants.ts';
import { fingerTarget } from '../../../theme/targets.styled.ts';
import { LOGO_OUTLINE } from './constants.ts';

export const Container = styled.div`
  font-size: ${th.fontSize(34)};

  /* Narrower than a finger target. A block of its own, as high as the line of its outline, so that
     its finger target and its focus ring go around a rectangle, as around the text it replaces */
  > a {
    display: inline-block;
    position: relative;
    ${fingerTarget}
  }

  /* At any width, while the other links take the accent from tablet up only */
  @media ${HOVER_POINTER_QUERY} {
    > a:hover {
      color: ${th.color('accent-foreground')};
    }
  }

  @media (max-height: ${th('screenHeights.short')}) {
    font-size: ${th.fontSize(28)};
  }
`;

/* Takes the box of the line of text that it replaces, in ems of the font size, its baseline on
   the baseline of the line, and fills the letters with the color of the link, as their text */
export const Outline = styled.svg`
  width: ${LOGO_OUTLINE.widthEm}em;
  height: ${LOGO_OUTLINE.heightEm}em;
  vertical-align: ${-LOGO_OUTLINE.descentEm}em;
  overflow: visible;
  fill: currentColor;
  stroke: none;
`;
