import styled, { th } from '@xstyled/styled-components';

/* ── Group wrapper — participates directly in Timeline ─────── */

export const GroupArticle = styled.section`
  position: relative;
  padding-left: ${th.space(22)}; /* mobile: indent past the dot */
  margin-bottom: ${th.space(20)};

  /* mobile dot (one dot per company group) */
  &::before {
    content: '';
    position: absolute;
    left: -1px; /* centres 12px dot on the 2px line at left:5px */
    top: 18px;
    width: 12px;
    height: 12px;
    border-radius: ${th.radius('circle')};
    background: ${th.color('accent-a85')};
    border: ${th.borderWidth('thick')} solid ${th.color('foreground-a80')};
    box-shadow: ${th.shadow('accentGlow')};
    z-index: ${th.zIndex('raised')};
  }

  @media (min-width: ${th('screens.tablet')}) {
    padding-left: 0;

    &::before {
      display: none;
    }
  }
`;

/* ── Role list ─────────────────────────────────────────────── */

export const RolesList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${th.space(10)};
`;

/* ── Role item — each role is its own timeline row ─────────── */

export const RoleItem = styled.li`
  position: relative;

  /* mobile dot per role */
  &::before {
    content: '';
    position: absolute;
    left: -28px; /* 22px padding + 6px (half of 12px dot) */
    top: 14px;
    width: 8px;
    height: 8px;
    border-radius: ${th.radius('circle')};
    background: ${th.color('accent-a65')};
    border: ${th.borderWidth('thick')} solid ${th.color('foreground-a50')};
    z-index: ${th.zIndex('raised')};
  }

  @media (min-width: ${th('screens.tablet')}) {
    display: grid;
    grid-template-columns: 90px 1fr;

    &::before {
      display: none;
    }
  }
`;

/* ── Period column — aligns with main timeline ─────────────── */

export const RolePeriodCol = styled.div`
  display: none;

  @media (min-width: ${th('screens.tablet')}) {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-right: ${th.space(18)};
    padding-top: ${th.space(5)};
    position: relative;
    font-size: ${th.fontSize(10)};
    letter-spacing: ${th.letterSpacing(2)};
    white-space: nowrap;

    /* dot on main timeline line */
    &::after {
      content: '';
      position: absolute;
      right: -6px; /* centres 12px dot on the line at 90px */
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: ${th.radius('circle')};
      background: ${th.color('accent-a85')};
      border: ${th.borderWidth('thick')} solid ${th.color('foreground-a80')};
      box-shadow: ${th.shadow('accentGlow')};
      z-index: ${th.zIndex('raised')};
    }
  }
`;

export const RolePeriodStart = styled.span`
  font-weight: ${th.fontWeight('bold')};
  color: ${th.color('accent-soft-a85')};
  line-height: ${th.lineHeight(150)};
`;

export const RolePeriodSep = styled.span`
  color: ${th.color('foreground-a20')};
  line-height: ${th.lineHeight(120)};
`;

export const RolePeriodEnd = styled.span`
  font-weight: ${th.fontWeight('medium')};
  color: ${th.color('foreground-a40')};
  line-height: ${th.lineHeight(150)};
`;

/* ── Role content — the card ────────────────────────────────── */

export const RoleContent = styled.div`
  min-width: 0;
  border: ${th.border('card')};
  border-radius: ${th.radius('md')};
  background-color: ${th.color('surface')};
  backdrop-filter: ${th('blurs.8')};
  -webkit-backdrop-filter: ${th('blurs.8')};
  box-shadow: ${th.shadow('card')};
  padding: ${th.space(14)} ${th.space(16)};
  transition-property: transform, box-shadow;
  transition-duration: ${th.duration('base')};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${th.shadow('cardHover')};
  }

  @media (min-width: ${th('screens.tablet')}) {
    margin-left: ${th.space(20)};
  }
`;

export const RoleHeader = styled.div`
  margin-bottom: ${th.space(10)};
`;

export const RoleName = styled.h3`
  margin: 0;
  font-size: ${th.fontSize(14)};
  font-weight: ${th.fontWeight('semibold')};
  letter-spacing: ${th.letterSpacing(1)};
  line-height: ${th.lineHeight(140)};

  @media (min-width: ${th('screens.tablet')}) {
    font-size: ${th.fontSize(15)};
  }
`;

export const RoleDetails = styled.div`
  font-size: ${th.fontSize(14)};
  font-weight: ${th.fontWeight('regular')};
  line-height: ${th.lineHeight(160)};
  margin-top: ${th.space(10)};
`;
