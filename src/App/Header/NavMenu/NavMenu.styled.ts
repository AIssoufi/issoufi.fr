import styled, { css, keyframes, th } from '@xstyled/styled-components';

const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-12px);
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

export const NavList = styled.ul`
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
    background 0.2s ease,
    color 0.2s ease;

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
      height: 2px;
      background-color: ${th.color('accent')};
      bottom: 4px;
      left: 16px;
      right: 16px;
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

export const CtaButton = styled.a`
  border-radius: ${th.radius('pill')};
  width: max-content;
  transform: scale(1);
  transition-property: color, border-color, transform, background-color, box-shadow;
  transition-duration: ${th.duration('base')};
  margin-top: ${th.space(28)};
  padding: ${th.space(14)} ${th.space(36)};
  color: ${th.color('foreground')};
  background-color: transparent;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a50')};
  height: max-content;
  font-size: ${th.fontSize(18)};
  letter-spacing: ${th.letterSpacing(6)};
  animation: ${fadeSlideIn} ${th.duration(300)} ${th.timingFunction('standard')} ${th.duration(200)}
    both;

  &:active {
    background-color: ${th.color('accent-a20')};
    border-color: ${th.color('accent-a60')};
  }

  .icon {
    margin-right: ${th.space('icon-gap')};
  }

  .text {
    text-transform: uppercase;
  }

  @media (min-width: ${th('screens.tablet')}) {
    margin-top: 0;
    margin-left: ${th.space(8)};
    padding: ${th.space(8)} ${th.space(22)};
    font-size: ${th.fontSize(14)};
    letter-spacing: ${th.letterSpacing(4)};
    animation: none;

    &:hover {
      transform: scale(1.06);
      color: ${th.color('accent')};
      background-color: ${th.color('foreground')};
      border-color: ${th.color('foreground')};
      box-shadow: ${th.shadow('accentGlowWide')};
    }

    &:hover .icon {
      stroke: ${th.color('accent')};
    }

    &:active {
      background-color: ${th.color('foreground')};
      border-color: ${th.color('foreground')};
    }
  }
`;
