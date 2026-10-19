import styled, { css, keyframes, th } from '@xstyled/styled-components';

import List from '../../../components/List';
import { theme } from '../../../theme';
import CvLink from './CvLink';
import ProfileLinks from './ProfileLinks';

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
      /* Centered while it fits, and from its top once it is higher than the screen, as on a phone
         held sideways, so that scrolling reaches all of it: plain centering would push its top
         above the screen. Browsers without the safe keyword keep the centering */
      justify-content: center;
      justify-content: safe center;
      position: fixed;
      inset: 0;
      z-index: ${th.zIndex('overlay')};
      overflow-y: auto;
      /* A scroll that reaches an end of the menu stops there, rather than scrolling the page */
      overscroll-behavior: contain;
      padding: ${th.space(20)} 0;
      /* Spaces the links, the profile icons and the CV link */
      gap: ${th.space(28)};
      background: ${th.color('overlay-mobile-menu')};
      backdrop-filter: ${th('blurs.20')};
      -webkit-backdrop-filter: ${th('blurs.20')};

      @media (max-height: ${th('screenHeights.short')}) {
        gap: ${th.space(16)};
      }
    `}

  @media (min-width: ${th('screens.tablet')}) {
    display: flex;
    flex-direction: row;
    align-items: center;
    background: transparent;
    gap: 0;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    position: static;
    z-index: auto;
    overflow-y: visible;
    padding: 0;
  }
`;

export const NavList = styled(List)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${th.space(8)};

  /* Closer links on a short screen */
  @media (max-height: ${th('screenHeights.short')}) {
    gap: 0;
  }

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
    color: ${th.color('accent-foreground')};
  }

  &:active {
    background: ${th.color('accent-a15')};
  }

  @media (max-height: ${th('screenHeights.short')}) {
    padding: ${th.space(6)} ${th.space(48)};
    font-size: ${th.fontSize(22)};
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
      color: ${th.color('accent-foreground')};
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
      color: ${th.color('accent-foreground')};
      font-weight: ${th.fontWeight('semibold')};
    }
  }
`;

/* A line between two groups of the bar on desktop, as high as the text of its links. The mobile
   menu spaces its groups with its gap instead */
export const Separator = styled.span`
  display: none;

  @media (min-width: ${th('screens.tablet')}) {
    display: block;
    height: ${th.size(16)};
    border-left: ${th.borderWidth('thin')} solid ${th.color('foreground-a25')};
  }
`;

/* Each item of the bar has 16 px on each side, as the route links do, so the lines stand halfway
   between their neighbours */
export const MenuProfileLinks = styled(ProfileLinks)`
  animation: ${fadeSlideIn} ${th.duration(300)} ${th.timingFunction('standard')} ${th.duration(200)}
    both;

  @media (min-width: ${th('screens.tablet')}) {
    padding: 0 ${th.space(16)};
    animation: none;
  }
`;

/* A pill with a download icon in the mobile menu, and a text link like the route links in the bar
   of the header on desktop */
export const MenuCvLink = styled(CvLink)`
  border-radius: ${th.radius('pill')};
  width: max-content;
  height: max-content;
  /* The smallest target recommended for a finger, still on a short screen */
  min-height: ${th.size('finger-target')};
  transition-property: border-color, background-color;
  transition-duration: ${th.duration('base')};
  padding: ${th.space(14)} ${th.space(36)};
  background-color: transparent;
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a50')};
  font-size: ${th.fontSize(18)};
  letter-spacing: ${th.letterSpacing(6)};
  animation: ${fadeSlideIn} ${th.duration(300)} ${th.timingFunction('standard')} ${th.duration(300)}
    both;

  &:active {
    background-color: ${th.color('accent-a20')};
    border-color: ${th.color('accent-a60')};
  }

  /* Smaller on a short screen, as on a phone held sideways, as the links are, which keeps it out
     of the column of the language toggle above the menu */
  @media (max-height: ${th('screenHeights.short')}) {
    padding: ${th.space(10)} ${th.space(24)};
    font-size: ${th.fontSize(16)};
  }

  @media (min-width: ${th('screens.tablet')}) {
    min-height: 0;
    padding: ${th.space(10)} ${th.space(16)};
    border: none;
    border-radius: 0;
    font-size: ${th.fontSize(15)};
    letter-spacing: ${th.letterSpacing(3)};
    animation: none;
    transform: scale(1);
    transition-property: transform, color;

    &:hover {
      color: ${th.color('accent-foreground')};
      transform: scale(1.06);
    }

    &:active {
      background-color: transparent;
    }

    /* The text says what the link does: the bar shows no icon */
    svg {
      display: none;
    }
  }
`;
