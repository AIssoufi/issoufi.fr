import styled, { th } from '@xstyled/styled-components';

export const WebApp = styled.div`
  display: grid;
  grid-template-areas:
    'header'
    'main';
  grid-template-rows: max-content 1fr;
  /* A plain 1fr never shrinks below its content, which would widen the page past the screen */
  grid-template-columns: minmax(0, 1fr);
  /* A minimum, not a height: the sticky header stays stuck only within this grid, so a grid one
     screen high would let it leave the screen after one screen of scrolling */
  min-height: 100vh;
  max-width: ${th.size('container')};
  margin: 0 auto;

  > header {
    padding-left: ${th.space('page')};
    padding-right: ${th.space('page')};
    grid-area: header;
  }
`;
