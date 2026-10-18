import styled, { th } from '@xstyled/styled-components';

/* Fixed across the whole width of the screen, so that its content can line up with the header.
   Clicks go through it, except on its content. Pages keep the site-footer-clearance space under
   their content (Page, src/components), so that their end scrolls above it: change it with the
   offset or the height of the footer */
export const Container = styled.footer`
  position: fixed;
  left: 0;
  right: 0;
  bottom: ${th.space(20)};
  z-index: ${th.zIndex('overlay')};
  pointer-events: none;
`;

/* Same width and gutters as the app container and its header (WebApp, App.styled.ts): the version
   starts under the logo, and the GitHub icon ends under the right end of the navigation */
export const Content = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  max-width: ${th.size('container')};
  margin: 0 auto;
  padding: 0 ${th.space('page')};

  > * {
    pointer-events: auto;
  }
`;

export const Version = styled.p`
  margin: 0;
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('medium')};
  letter-spacing: ${th.letterSpacing(4)};
  color: ${th.color('foreground-a65')};
  white-space: nowrap;
`;

export const GitHubLink = styled.a`
  display: flex;
  margin-left: auto;
  color: ${th.color('foreground-a65')};
  transition: color ${th.duration(250)} ${th.timingFunction('standard')};

  &:hover {
    color: ${th.color('foreground')};
  }

  svg {
    width: auto;
    height: ${th.size(32)};
  }
`;
