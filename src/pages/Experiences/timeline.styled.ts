import { css, th } from '@xstyled/styled-components';

/* Glowing dot marking a job on the timeline line. Each caller places it. */
export const timelineDot = css`
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: ${th.radius('circle')};
  background: ${th.color('accent-a85')};
  border: ${th.borderWidth('thick')} solid ${th.color('foreground-a80')};
  box-shadow: ${th.shadow('accentGlow')};
  z-index: ${th.zIndex('raised')};
`;

/* One company on the timeline, a single job or a group of roles: spaced from the next one,
   with its dot on the line on mobile. On desktop, its period column draws the dot instead. */
export const companyBlock = css`
  position: relative;
  margin-bottom: ${th.space(20)};

  &::before {
    ${timelineDot}
    left: -1px; /* centered on the line at left: 5px (5 - 6 = -1) */
    top: 18px;
  }

  @media (min-width: ${th('screens.tablet')}) {
    &::before {
      display: none;
    }
  }
`;

/* Desktop layout of a timeline row: the 90 px period column, then the content. */
export const timelineRow = css`
  @media (min-width: ${th('screens.tablet')}) {
    display: grid;
    grid-template-columns: 90px 1fr;
  }
`;

/* Frosted card of a job or a role, lifted on hover. Each caller sets its padding. */
export const card = css`
  border: ${th.border('card')};
  border-radius: ${th.radius('md')};
  background-color: ${th.color('surface')};
  backdrop-filter: ${th('blurs.8')};
  -webkit-backdrop-filter: ${th('blurs.8')};
  box-shadow: ${th.shadow('card')};
  transition-property: transform, box-shadow;
  transition-duration: ${th.duration('base')};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${th.shadow('cardHover')};
  }
`;
