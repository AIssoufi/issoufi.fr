/**
 * Number of cards that the row of a section holds before "Show all" is used: three, which a wide
 * screen shows whole, while a narrower one shows one or two whole and scrolls to the others. The
 * arrows move the row by the number of cards it shows whole, never more than this.
 */
export const ROW_CARD_COUNT = 3;
/**
 * How far a card may pass the right edge of the row and still count as shown whole: the width of
 * the row is read rounded to a whole pixel.
 */
export const WHOLE_CARD_TOLERANCE_PX = 1;
/** Duration of the like button's pop animation; matches the CSS animation. */
export const LIKE_ANIMATION_MS = 450;
/**
 * `localStorage` key holding the ids of the projects that the visitor liked, as a JSON list
 * (`[1,5]`), shared by every section of the page, in every language.
 */
export const LIKED_PROJECTS_STORAGE_KEY = 'likedProjects';
/** Largest tilt of a card when the pointer is at one of its edges. */
export const CARD_MAX_TILT_DEG = 6;
/** Distance of the 3D viewpoint used for the card tilt; smaller values exaggerate it. */
export const CARD_PERSPECTIVE_PX = 800;
/** How much a hovered card rises. */
export const CARD_HOVER_LIFT_PX = 4;
