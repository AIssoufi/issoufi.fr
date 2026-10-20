/**
 * Narrowest width, in pixels, that the title of a project keeps beside its state badge: when the
 * header has less room left, the badge wraps under the title. A 375 px wide screen leaves 124 px
 * to the title beside the longest badge, "Livré dans les délais", and keeps both on one line; a
 * 320 px wide screen leaves less than 120 px beside any badge, and puts each one under its title.
 */
export const MIN_TITLE_WIDTH_PX = 120;
