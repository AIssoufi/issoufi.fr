// The theme module alone, without the global styles, so that the browser tests can import this
import { theme } from '../../../theme/theme';

/**
 * Number of cards that the row of a section holds before "Show all" is used: three, which a wide
 * screen shows whole, while a narrower one shows one or two whole and scrolls to the others. The
 * arrows move the row by the number of cards it shows whole, never more than this.
 */
export const ROW_CARD_COUNT = 3;
/**
 * Widths of the files of each thumbnail, in pixels, from the narrowest: each original is encoded
 * at these widths but those wider than itself, and at its own width in their place (see the
 * README). With {@link THUMBNAIL_SIZES}, they serve the card of any screen of one or two device
 * pixels per CSS pixel without enlarging it, and a phone of one with a file at most twice as wide.
 */
export const THUMBNAIL_FILE_WIDTHS_PX = [480, 720, 960, 1200] as const;
/**
 * Widest ratio of a screenshot, 16:10: a card is 220 px high inside its border, so a 16:10
 * screenshot that covers it is 352 px wide, which the 720 px file serves on a 2x screen even where
 * the card is narrower. A wider one would be enlarged there.
 */
export const MAX_THUMBNAIL_ASPECT_RATIO = 16 / 10;
/**
 * Width that a thumbnail takes on the screen, the `sizes` of its `img`: the browser downloads the
 * narrowest file of its `srcset` at least this wide times the device pixels per CSS pixel. The
 * whole screen with one column of cards, a half with two, a third with three, then a third of the
 * app container, where the cards stop growing: always at least the width of the card.
 */
export const THUMBNAIL_SIZES = [
  `(min-width: ${theme.sizes.container}) calc(${theme.sizes.container} / ${ROW_CARD_COUNT})`,
  `(min-width: ${theme.screens['three-project-columns']}) 33vw`,
  `(min-width: ${theme.screens['two-project-columns']}) 50vw`,
  '100vw',
].join(', ');
/**
 * How far a card may pass the right edge of the row and still count as shown whole: the width of
 * the row is read rounded to a whole pixel.
 */
export const WHOLE_CARD_TOLERANCE_PX = 1;
/**
 * Duration of the like button's pop animation, written only here: the CSS animation of the heart
 * reads it, and `useLikes` ends the animated state of the button after it.
 */
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
