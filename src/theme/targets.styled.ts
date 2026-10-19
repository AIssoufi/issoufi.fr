import { css, th } from '@xstyled/styled-components';

/* Smallest side of the area that a finger taps on a control: the finger-target size of the
   theme, the target size that the Web Content Accessibility Guidelines recommend (44 px). */
export const fingerTargetSize = th.size('finger-target');

/* Offset from an edge of a box, such as `top`, that centers a finger target on the box, along
   that edge: negative for a box smaller than a finger target. */
export const fingerTargetCenteringOffset = css`calc((100% - ${fingerTargetSize}) / 2)`;

/* Grows the area that catches the taps of a control smaller than a finger target to that size, at
   least, centered on it, without changing anything on screen: an empty ::after, around the nearest
   positioned ancestor, which the caller sets, usually the control itself. A larger box keeps its
   size. It moves no layer of its own, so the text of the control is drawn as before. The ::after
   of the control must be free, and the targets of two controls closer than a finger target
   overlap: place theirs by hand, as the language toggle does. */
export const fingerTarget = css`
  &::after {
    content: '';
    position: absolute;
    inset: calc(50% - max(50%, ${fingerTargetSize} / 2));
  }
`;
