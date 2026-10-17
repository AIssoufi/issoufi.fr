import { createGlobalStyle, th } from '@xstyled/styled-components';

/** Base styles of the document (body, links, buttons, lists, icons), built from the tokens. */
export const GlobalStyle = createGlobalStyle`
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
`;
