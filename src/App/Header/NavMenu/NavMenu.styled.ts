import styled, { css, keyframes, th } from '@xstyled/styled-components';

import List from '../../../components/List';
import { theme } from '../../../theme';
import CvLink from '../CvLink';
import GitHubLink from '../GitHubLink';

// Keyframes have no theme context, so they read the theme object rather than the th helpers
const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-${theme.space[12]});
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const Nav = styled.nav<{ $mobileMenuIsOpen: boolean }>`
  display: none;

  ${props =>
    props.$mobileMenuIsOpen &&
    css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: fixed;
      inset: 0;
      z-index: ${th.zIndex('overlay')};
      background: ${th.color('overlay-mobile-menu')};
      backdrop-filter: ${th('blurs.20')};
      -webkit-backdrop-filter: ${th('blurs.20')};
    `}

  @media (min-width: ${th('screens.tablet')}) {
    display: flex;
    flex-direction: row;
    align-items: center;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    position: static;
    z-index: auto;
  }
`;

export const NavList = styled(List)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${th.space(8)};

  @media (min-width: ${th('screens.tablet')}) {
    flex-direction: row;
    align-items: center;
    gap: 0;
  }
`;

export const NavItem = styled.li`
  padding: ${th.space(16)} ${th.space(48)};
  font-size: ${th.fontSize(28)};
  font-weight: ${th.fontWeight('light')};
  letter-spacing: ${th.letterSpacing(6)};
  animation: ${fadeSlideIn} ${th.duration(300)} ${th.timingFunction('standard')} both;
  border-radius: ${th.radius('md')};
  transition:
    background ${th.duration(200)} ${th.timingFunction('standard')},
    color ${th.duration(200)} ${th.timingFunction('standard')};

  &:active a {
    color: ${th.color('accent')};
  }

  &:active {
    background: ${th.color('accent-a15')};
  }

  @media (min-width: ${th('screens.tablet')}) {
    padding: ${th.space(10)} ${th.space(16)};
    font-size: ${th.fontSize(15)};
    font-weight: ${th.fontWeight('regular')};
    letter-spacing: ${th.letterSpacing(3)};
    animation: none;
    border-radius: 0;
    position: relative;
    transform: scale(1);
    transition-property: transform, color;
    transition-duration: ${th.duration('base')};

    &:hover {
      transform: scale(1.06);
      background: transparent;
    }

    &:hover a {
      color: ${th.color('accent')};
    }

    &:active {
      background: transparent;
    }

    > a::before {
      content: '';
      position: absolute;
      height: ${th.size(2)};
      background-color: ${th.color('accent')};
      bottom: ${th.space(4)};
      left: ${th.space(16)};
      right: ${th.space(16)};
      display: none;
      border-radius: ${th.radius(2)};
    }

    > a.active::before {
      display: block;
    }

    > a.active {
      color: ${th.color('accent')};
      font-weight: ${th.fontWeight('semibold')};
    }
  }
`;

/* The pill of the mobile menu, hidden on desktop, where the header floats a round CV button
   between the language toggle and the GitHub icon */
export const MenuCvLink = styled(CvLink)`
  border-radius: ${th.radius('pill')};
  width: max-content;
  height: max-content;
  transition-property: border-color, background-color;
  transition-duration: ${th.duration('base')};
  margin-top: ${th.space(28)};
  padding: ${th.space(14)} ${th.space(36)};
  background-color: transparent;
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a50')};
  font-size: ${th.fontSize(18)};
  letter-spacing: ${th.letterSpacing(6)};
  animation: ${fadeSlideIn} ${th.duration(300)} ${th.timingFunction('standard')} ${th.duration(200)}
    both;

  &:active {
    background-color: ${th.color('accent-a20')};
    border-color: ${th.color('accent-a60')};
  }

  @media (min-width: ${th('screens.tablet')}) {
    display: none;
  }
`;

/* Shown in the mobile menu only: on desktop, the header floats the GitHub icon under the CV
   button */
export const MenuGitHubLink = styled(GitHubLink)`
  margin-top: ${th.space(28)};
  animation: ${fadeSlideIn} ${th.duration(300)} ${th.timingFunction('standard')} ${th.duration(300)}
    both;

  @media (min-width: ${th('screens.tablet')}) {
    display: none;
  }
`;
