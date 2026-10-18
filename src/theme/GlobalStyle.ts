import { createGlobalStyle, th } from '@xstyled/styled-components';

/**
 * Base styles of the document (box sizing, body, links, buttons, lists, icons), built from the
 * tokens. Every element is sized with `border-box`, so a width includes its padding and border.
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

  button:hover {
    cursor: pointer;
    transform: scale(1.06);
  }

  a {
    color: ${th.color('foreground')};
    text-decoration: none;
    transition-property: color;
    transition-duration: ${th.duration('base')};
  }

  @media (min-width: ${th('screens.tablet')}) {
    a:hover {
      color: ${th.color('accent')};
    }
  }

  svg {
    stroke: ${th.color('foreground')};
    transition-property: stroke;
    transition-duration: ${th.duration('base')};
  }

  /* The heading of a page takes the focus after a navigation, but cannot be activated: a focus
     ring would make it look like a control. Keep the selector in line with PAGE_HEADING_SELECTOR
     and SCRIPT_ONLY_TAB_INDEX (src/App/PageHeadingFocus/constants.ts); App.spec.jsx checks it */
  h1[tabindex='-1']:focus {
    outline: none;
  }
`;
