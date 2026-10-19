/**
 * Elements that a `VisuallyHidden` text can be: a `span` within a line of text, or a heading that
 * names a part of the page that the design shows without a title.
 */
export const VISUALLY_HIDDEN_ELEMENTS = ['span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/** Element of a `VisuallyHidden` text when none, or one it cannot be, is given. */
export const DEFAULT_VISUALLY_HIDDEN_ELEMENT = 'span';
