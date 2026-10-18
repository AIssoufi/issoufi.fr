import { css, th } from '@xstyled/styled-components';

/* Width of the timeline line, which Timeline (Experiences.styled.ts) draws. */
export const lineWidth = th.size(2);

/* Left edge of the mobile line, from the left edge of the timeline. */
export const mobileLineLeft = th.space(5);

/* Center of the mobile line, from the left edge of the timeline. The mobile dots center themselves
   on it with translateX(-50%), so their size and box-sizing do not matter. */
export const mobileLineCenter = css`calc(${mobileLineLeft} + ${lineWidth} / 2)`;

/* How far the content of the timeline starts from its left edge on mobile, past the line and its
   dots. Both TimelineContent (a single job) and GroupItem (a group of roles) indent by it. */
export const mobileContentIndent = th.space(22);

/* Glowing dot marking an entry on the timeline line. Each caller places it.
   Every element whose pseudo-element draws a dot names it in its data-timeline-dot attribute
   (before or after), as Timeline does for its line in data-timeline-line, so that
   e2e/timeline.e2e.ts measures them: keep the attribute in step with the pseudo-element. */
export const timelineDot = css`
  content: '';
  position: absolute;
  width: ${th.size(16)};
  height: ${th.size(16)};
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
    left: ${mobileLineCenter};
    transform: translateX(-50%);
    top: ${th.space(18)};
  }

  @media (min-width: ${th('screens.tablet')}) {
    &::before {
      display: none;
    }
  }
`;

/* Width of the period column of a timeline row on desktop. The line runs along its right edge. */
export const periodColumnWidth = th.size(90);

/* Desktop layout of a timeline row: the period column, then the content. */
export const timelineRow = css`
  @media (min-width: ${th('screens.tablet')}) {
    display: grid;
    grid-template-columns: ${periodColumnWidth} 1fr;
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
    transform: translateY(${th.space(-2)});
    box-shadow: ${th.shadow('cardHover')};
  }
`;
