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

/* Width of the period column from the wide breakpoint, where its dates are larger: wide enough
   for the longest of them, "Aujourd’hui", 86 px at 14 px, next to the padding of the column. */
export const widePeriodColumnWidth = th.size(110);

/* Desktop layout of a timeline row: the period column, then the content. */
export const timelineRow = css`
  @media (min-width: ${th('screens.tablet')}) {
    display: grid;
    grid-template-columns: ${periodColumnWidth} 1fr;
  }

  @media (min-width: ${th('screens.wide')}) {
    grid-template-columns: ${widePeriodColumnWidth} 1fr;
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

/* Two columns of a job card from the two-job-columns breakpoint: its summary, then its
   technologies, on the left, and its description on the right, as high as both. The description
   column is as wide as its lines, which its measure keeps short, against the right edge of the
   card, and the left column takes the rest of the card. The measure stays on the description
   rather than in the column, since a width in `ch` follows the font size of its own element.
   Below it, the card stacks them in the order of the page. The summary places itself in the
   first free cell; the description and the technologies place themselves with cardDetails and
   cardTechnologies */
export const cardColumns = css`
  @media (min-width: ${th('screens.two-job-columns')}) {
    display: grid;
    grid-template-columns: minmax(${th.size(240)}, 1fr) auto;
    grid-template-rows: auto 1fr;
    column-gap: ${th.space(32)};
    align-items: start;
  }
`;

/* Description of a job card: on the right of the card from the two-job-columns breakpoint, lined
   up with the top of the summary, its lines kept short however wide the card */
export const cardDetails = css`
  @media (min-width: ${th('screens.two-job-columns')}) {
    grid-column: 2;
    grid-row: 1 / span 2;
    max-width: ${th.size('text-measure')};
    margin-top: 0;
  }
`;

/* Technologies of a job card: under its summary, on the left, from the two-job-columns
   breakpoint */
export const cardTechnologies = css`
  @media (min-width: ${th('screens.two-job-columns')}) {
    grid-column: 1;
    grid-row: 2;
  }
`;
