import styled, { th } from '@xstyled/styled-components';

export const Main = styled.main<{ $backgroundImage?: string }>`
  /* The room under the content lets its end scroll above the site footer (src/App/SiteFooter) */
  padding: ${th.space(16)} ${th.space('page')} ${th.space('site-footer-clearance')};
  position: relative;
  grid-area: main;

  &::before {
    content: '';
    display: block;
    position: fixed;
    z-index: ${th.zIndex('pageBackground')};
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-image: ${props =>
      props.$backgroundImage ? `url(${props.$backgroundImage})` : 'none'};
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
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
