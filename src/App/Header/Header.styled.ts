import styled, { css, th } from '@xstyled/styled-components';

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
    height: 72px;
    backdrop-filter: ${th('blurs.12')};
    -webkit-backdrop-filter: ${th('blurs.12')};
    background: linear-gradient(180deg, ${th.color('shade-a55')} 0%, ${th.color('shade-a0')} 100%);
    z-index: ${th.zIndex('behind')};
    pointer-events: none;
  }
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

export const Menu = styled.div<MenuProps>`
  display: flex;
  flex-direction: row;

  ${props =>
    props.$isSticky &&
    css`
      position: fixed;
      top: 20px;
      z-index: ${th.zIndex('raised')};
      right: 20px;
    `}
`;

interface MenuProps {
  $isSticky: boolean;
}
