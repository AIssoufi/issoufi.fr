// The theme module alone, without the global styles, so that the browser tests can import this
import { theme } from '../../../theme/theme.ts';

/**
 * Number of cards that the row of a section holds before "Show all" is used: three, which a wide
 * screen shows whole, while a narrower one shows one or two whole and scrolls to the others. The
 * arrows move the row by the number of cards it shows whole, never more than this.
 */
export const ROW_CARD_COUNT = 3;
/**
 * Widths of the files of each thumbnail, in pixels, from the narrowest: each original is encoded
 * at these widths but those wider than itself, and at its own width in their place (see
 * `docs/assets.md`). With {@link THUMBNAIL_SIZES}, they serve the card of any screen of one or
 * two device pixels per CSS pixel without enlarging it, and a phone of one with a file at most
 * twice as wide.
 */
export const THUMBNAIL_FILE_WIDTHS_PX = [480, 720, 960, 1200] as const;
/**
 * Widest ratio of a screenshot, 16:10. A thumbnail crops its screenshot to cover its box
 * (`object-fit: cover`), so where the box is narrower than this ratio, the screenshot is drawn
 * wider than the card, as wide as the box is high times its ratio: 352 px below the `wide`
 * breakpoint, where the box is 220 px high inside its border. {@link THUMBNAIL_SIZES} gives that
 * width there: a wider screenshot would be drawn wider still, and enlarged.
 */
export const MAX_THUMBNAIL_ASPECT_RATIO = 16 / 10;
// Gutter of the page, and space around each card, as `ProjectGrid` and `ProjectItem` use them
const PAGE_GUTTER = theme.space.page;
const CARD_MARGIN = theme.space['project-card-margin'];
// Width of the row of cards, which its columns share: below the `tablet` breakpoint, the screen
// less the padding of the list, the gutter less the margin of the cards; from it, the page less
// its gutters, up to the app container, wider from the `wide` breakpoint
const MOBILE_ROW_WIDTH = `(100vw - 2 * (${PAGE_GUTTER} - ${CARD_MARGIN}))`;
const DESKTOP_ROW_WIDTH = `(100vw - 2 * ${PAGE_GUTTER})`;
const CONTAINER_ROW_WIDTH = `(${theme.sizes.container} - 2 * ${PAGE_GUTTER})`;
const WIDE_CONTAINER_ROW_WIDTH = `(${theme.sizes['container-wide']} - 2 * ${PAGE_GUTTER})`;
// What a card leaves of its column: its margin on both sides
const CARD_MARGINS = `2 * ${CARD_MARGIN}`;
// Width of a card with one column, the whole row less its margins
const ONE_COLUMN_CARD_WIDTH = `${MOBILE_ROW_WIDTH} - ${CARD_MARGINS}`;
// Width of a screenshot of the widest ratio that covers the box of a thumbnail, as `ImageContainer`
// lays it out: its height inside its border times the ratio, larger from the `wide` breakpoint
const THUMBNAIL_BORDERS = `2 * ${theme.borderWidths.thin}`;
const COVER_WIDTH = `(${theme.sizes['project-thumbnail']} - ${THUMBNAIL_BORDERS}) * ${MAX_THUMBNAIL_ASPECT_RATIO}`;
const WIDE_COVER_WIDTH = `(${theme.sizes['project-thumbnail-wide']} - ${THUMBNAIL_BORDERS}) * ${MAX_THUMBNAIL_ASPECT_RATIO}`;
// Layouts of the cards from a screen width, from the widest: the media condition from which each
// one applies, the width of a card, a third of the row with three columns and a half with two,
// and the width of a screenshot of the widest ratio that covers its thumbnail
const MEDIA_LAYOUTS = [
  {
    media: `(min-width: ${theme.screens.wide})`,
    cardWidth: `${WIDE_CONTAINER_ROW_WIDTH} / 3 - ${CARD_MARGINS}`,
    coverWidth: WIDE_COVER_WIDTH,
  },
  {
    media: `(min-width: ${theme.sizes.container})`,
    cardWidth: `${CONTAINER_ROW_WIDTH} / 3 - ${CARD_MARGINS}`,
    coverWidth: COVER_WIDTH,
  },
  {
    media: `(min-width: ${theme.screens['three-project-columns']})`,
    cardWidth: `${DESKTOP_ROW_WIDTH} / 3 - ${CARD_MARGINS}`,
    coverWidth: COVER_WIDTH,
  },
  {
    media: `(min-width: ${theme.screens.tablet})`,
    cardWidth: `${DESKTOP_ROW_WIDTH} / 2 - ${CARD_MARGINS}`,
    coverWidth: COVER_WIDTH,
  },
  {
    media: `(min-width: ${theme.screens['two-project-columns']})`,
    cardWidth: `${MOBILE_ROW_WIDTH} / 2 - ${CARD_MARGINS}`,
    coverWidth: COVER_WIDTH,
  },
] as const;
/**
 * Width at which a thumbnail draws its screenshot, the `sizes` of its `img`: the browser downloads
 * the narrowest file of its `srcset` at least this wide times the device pixels per CSS pixel. It
 * is the width of the card, as `ProjectGrid` and `ProjectItem` lay it out, or the width of a
 * screenshot of the widest ratio that covers the thumbnail where it is wider, so that no
 * thumbnail is enlarged, and no more, so that a phone downloads no file wider than it needs.
 * Each width comes twice: with `max()`, then the width of the card alone, for a browser that
 * refuses `max()` in `sizes`, as Safari before 26.4, which skips the first.
 */
export const THUMBNAIL_SIZES = [
  ...MEDIA_LAYOUTS.flatMap(({ media, cardWidth, coverWidth }) => [
    `${media} max(${cardWidth}, ${coverWidth})`,
    `${media} calc(${cardWidth})`,
  ]),
  `max(${ONE_COLUMN_CARD_WIDTH}, ${COVER_WIDTH})`,
  `calc(${ONE_COLUMN_CARD_WIDTH})`,
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
