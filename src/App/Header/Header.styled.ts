import styled, { css, th } from '@xstyled/styled-components';

import CvLink from './CvLink';

export const Container = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-size: ${th.fontSize(18)};
  /* A height rather than a vertical padding, which its blurred band shares: fixed on the screen,
     the band cannot take the height of the header from it */
  height: ${th.size('header')};
  position: sticky;
  top: 0;
  z-index: ${th.zIndex('header')};

  /* Blurs what scrolls under the header, over the whole width of the screen */
  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: ${th.size('header')};
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
   the screen from tablet up, centered vertically, with the CV button and the GitHub icon under
   it */
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

/* Hidden on mobile, where the mobile menu holds the CV button and the GitHub icon. From tablet up,
   they stack centered under the language toggle, out of the flow, so the toggle stays centered on
   the screen */
export const FloatingLinks = styled.div`
  display: none;

  @media (min-width: ${th('screens.tablet')}) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${th.space(16)};
    position: absolute;
    top: calc(100% + ${th.space(16)});
    left: 50%;
    transform: translateX(-50%);
  }
`;

/* White fill of the floating CV button, on hover and while pressed, as on a touch screen */
const filledCvLink = css`
  color: ${th.color('accent')};
  background-color: ${th.color('foreground')};
  border-color: ${th.color('foreground')};
  box-shadow: ${th.shadow('accentGlowWide')};
`;

/* Only shown from tablet up, in the floating links: a frosted circle like the language toggle,
   outlined like a call to action */
export const FloatingCvLink = styled(CvLink)`
  width: ${th.size('round-button')};
  height: ${th.size('round-button')};
  border-radius: ${th.radius('circle')};
  border: ${th.borderWidth('thin')} solid ${th.color('foreground-a50')};
  background-color: ${th.color('shade-a35')};
  backdrop-filter: ${th('blurs.14')};
  -webkit-backdrop-filter: ${th('blurs.14')};
  box-shadow: ${th.shadow('card')};
  font-size: ${th.fontSize(13)};
  font-weight: ${th.fontWeight('semibold')};
  letter-spacing: ${th.letterSpacing(4)};
  transform: scale(1);
  transition-property: color, border-color, transform, background-color, box-shadow;
  transition-duration: ${th.duration('base')};

  &:hover {
    ${filledCvLink}
    transform: scale(1.06);
  }

  &:active {
    ${filledCvLink}
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
