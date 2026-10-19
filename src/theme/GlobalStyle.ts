import { createGlobalStyle, th } from '@xstyled/styled-components';

import { FORCED_COLORS_QUERY, HOVER_POINTER_QUERY, REDUCED_MOTION_QUERY } from './constants.ts';

/**
 * Base styles of the document (box sizing, body, links, buttons, lists, icons), built from the
 * tokens. Every element is sized with `border-box`, so a width includes its padding and border.
 * Buttons grow, and links take the accent from tablet up, under a pointer that hovers only
 * ({@link HOVER_POINTER_QUERY}). Icons draw their strokes in the foreground color, and in the text
 * color of their element in forced colors mode ({@link FORCED_COLORS_QUERY}). With reduced motion
 * ({@link REDUCED_MOTION_QUERY}), animations and transitions are instant.
 */
export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: ${th.font('body')};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${th.color('background')};
    color: ${th.color('foreground')};
    font-size: ${th.fontSize(18)};
    font-weight: ${th.fontWeight('regular')};
  }

  code {
    font-family: ${th.font('code')};
  }

  /* Spreads the words of a heading evenly over its lines, and keeps a paragraph from ending on a
     word alone, so that no line holds a single word where the text can avoid it */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    text-wrap: balance;
  }

  p {
    text-wrap: pretty;
  }

  /* Without bullets, Safari no longer exposes a ul as a list: render lists with List
     (src/components/List), which gives them back their role */
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  button {
    border-radius: ${th.radius('pill')};
    border-width: ${th.borderWidth('thin')};
    border-style: solid;
    width: max-content;
    transform: scale(1);
    transition-property: color, border-color, transform, background-color, box-shadow;
    transition-duration: ${th.duration('base')};
    letter-spacing: ${th.letterSpacing(2)};
  }

  @media ${HOVER_POINTER_QUERY} {
    button:hover {
      cursor: pointer;
      transform: scale(1.06);
    }
  }

  a {
    color: ${th.color('foreground')};
    text-decoration: none;
    transition-property: color;
    transition-duration: ${th.duration('base')};
  }

  @media (min-width: ${th('screens.tablet')}) and ${HOVER_POINTER_QUERY} {
    a:hover {
      color: ${th.color('accent-foreground')};
    }
  }

  svg {
    stroke: ${th.color('foreground')};
    transition-property: stroke;
    transition-duration: ${th.duration('base')};
  }

  /* Forced colors mode keeps the colors of an SVG, whose white strokes would vanish on the light
     background of a light contrast theme: they take the text color of its palette instead. An icon
     sets no stroke on its paths, which would win over both rules */
  @media ${FORCED_COLORS_QUERY} {
    svg {
      stroke: currentColor;
    }
  }

  /* The heading of a page takes the focus after a navigation, but cannot be activated: a focus
     ring would make it look like a control. Keep the selector in line with PAGE_HEADING_SELECTOR
     and SCRIPT_ONLY_TAB_INDEX (src/App/constants.ts); App.spec.jsx checks it */
  h1[tabindex='-1']:focus {
    outline: none;
  }

  /* With reduced motion, every animation plays once and jumps to its end, at once, and every
     transition is instant and starts at once: content that slides in shows right away, a change in
     several steps, such as the burger icon turning into a cross, shows whole, and nothing loops.
     Important, so that it also wins over the styles of the components and the inline styles of the
     hooks */
  @media ${REDUCED_MOTION_QUERY} {
    *,
    *::before,
    *::after {
      animation-duration: ${th.duration('instant')} !important;
      animation-delay: 0s !important;
      animation-iteration-count: 1 !important;
      transition-duration: ${th.duration('instant')} !important;
      transition-delay: 0s !important;
    }
  }
`;
