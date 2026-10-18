import styled, { css, th } from '@xstyled/styled-components';

import GitHubLink from './GitHubLink';

export const Container = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-size: ${th.fontSize(18)};
  padding: ${th.space(20)} 0;
  position: sticky;
  top: 0;
  z-index: ${th.zIndex('header')};

  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: ${th.size(72)};
    backdrop-filter: ${th('blurs.12')};
    -webkit-backdrop-filter: ${th('blurs.12')};
    background: linear-gradient(180deg, ${th.color('shade-a55')} 0%, ${th.color('shade-a0')} 100%);
    z-index: ${th.zIndex('behind')};
    pointer-events: none;
  }
`;

export const Brand = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: ${th.space(8)};
`;

export const Logo = styled.div`
  font-family: ${th.font('display')};
  font-size: ${th.fontSize(34)};
  transform: scale(1);
  transition-property: transform, color;
  transition-duration: ${th.duration('base')};
  letter-spacing: ${th.letterSpacing(2)};

  :hover {
    transform: scale(1.08);
    color: ${th.color('accent')};
  }
`;

export const BuildVersion = styled.span`
  font-size: ${th.fontSize(11)};
  font-weight: ${th.fontWeight('medium')};
  letter-spacing: ${th.letterSpacing(4)};
  color: ${th.color('foreground-a65')};
  white-space: nowrap;
`;

/* Holds the language toggle in the row of the header on mobile, and floats it on the right edge of
   the screen from tablet up, centered vertically */
export const FloatingControls = styled.div`
  position: relative;

  @media (min-width: ${th('screens.tablet')}) {
    position: fixed;
    right: ${th.space(20)};
    top: 50%;
    transform: translateY(-50%);
    z-index: ${th.zIndex('overlay')};
  }
`;

/* Hidden on mobile, where the mobile menu holds the GitHub icon. From tablet up, centered under
   the language toggle and out of the flow, so the toggle stays centered on the screen */
export const FloatingGitHubLink = styled(GitHubLink)`
  display: none;

  @media (min-width: ${th('screens.tablet')}) {
    display: flex;
    position: absolute;
    top: calc(100% + ${th.space(16)});
    left: 50%;
    transform: translateX(-50%);
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${th.space(12)};
`;

export const Menu = styled.div<MenuProps>`
  display: flex;
  flex-direction: row;

  ${props =>
    props.$isSticky &&
    css`
      position: fixed;
      top: ${th.space(20)};
      z-index: ${th.zIndex('raised')};
      right: ${th.space(20)};
    `}
`;

interface MenuProps {
  $isSticky: boolean;
}
