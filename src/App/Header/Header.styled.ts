import styled, { th } from '@xstyled/styled-components';

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

  /* Leaves most of a short screen to the page, as on a phone held sideways */
  @media (max-height: ${th('screenHeights.short')}) {
    height: ${th.size('header-compact')};

    &::after {
      height: ${th.size('header-compact')};
    }
  }
`;

export const Brand = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: ${th.space(8)};
`;

export const BuildVersion = styled.span`
  font-size: ${th.fontSize(12)};
  font-weight: ${th.fontWeight('medium')};
  letter-spacing: ${th.letterSpacing(4)};
  color: ${th.color('foreground-a65')};
  white-space: nowrap;
`;

/* Holds the language toggle in the row of the header on mobile, above the open menu like the
   burger, so the language can change while the menu is open, and after the bar on tablets, where
   it floats over the controls of the cards otherwise. It floats alone on the right edge of the
   screen on wider ones, centered vertically. It follows the navigation in the page, so that Tab
   reaches it after the links, as on the screen from tablet up, but stays before the burger in the
   row on mobile */
export const FloatingControls = styled.div`
  position: relative;
  z-index: ${th.zIndex('header')};
  order: -1;

  @media (min-width: ${th('screens.tablet')}) {
    order: 0;
  }

  @media (min-width: ${th('screens.floating-language-toggle')}) {
    position: fixed;
    right: ${th.space(20)};
    top: 50%;
    transform: translateY(-50%);
    z-index: ${th.zIndex('overlay')};
  }
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${th.space(12)};
`;

/* Stays in the row of the header while the menu is open: the header stays at the top of the
   screen, so the burger and the language toggle next to it keep their place */
export const Menu = styled.div`
  display: flex;
  flex-direction: row;
`;
