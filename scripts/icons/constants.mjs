// @ts-check

/**
 * Modules of the site read by the script through Vite (`loadSiteModules`), which compiles their
 * TypeScript: the design tokens, for the colors, the font and the letter spacing of the logo, the
 * web fonts of the site and their `@font-face` rules, and the icons to draw, with their files and
 * sizes. Paths are relative to the project root.
 */
export const SOURCE_MODULES = {
  theme: '/src/theme/theme.ts',
  fontFaces: '/src/theme/constants.ts',
  fontUtils: '/src/theme/utils.ts',
  icons: '/src/utils/icons.ts',
};

/** Font stack of the theme that draws the logo in the header. */
export const LOGO_FONT = 'display';

/** Key of the letter spacing of the logo in the header, in the `letterSpacings` of the theme. */
export const LOGO_LETTER_SPACING = 2;

/**
 * Width and height of the SVG favicon, in the units of its view box: vector, it is sharp at any
 * size, and its coordinates are rounded to a hundredth of these units.
 */
export const FAVICON_SIZE = 64;

/**
 * Sizes of the images of the ICO favicon, in pixels: those of the tabs and of the bookmarks, on
 * screens of 1, 2 and 3 device pixels per CSS pixel.
 */
export const ICO_SIZES_PX = [16, 32, 48];

/** Radius of the corners of a tile, as a share of its width, close to the one of iOS icons. */
export const TILE_CORNER_RADIUS_RATIO = 0.2;

/**
 * Radius of the safe zone of a maskable icon, as a share of its width: the circle of 80 % of its
 * width at its center, which every shape of a home screen keeps.
 * @see https://www.w3.org/TR/appmanifest/#icon-masks
 */
export const MASKABLE_SAFE_ZONE_RADIUS_RATIO = 0.4;

/**
 * Layout of the favicons: a tile with a larger logo than the other icons, so that it stays
 * readable at 16 px.
 * @type {import('./utils/logo.mjs').IconLayout}
 */
const FAVICON_LAYOUT = { shape: 'tile', logoWidthRatio: 0.8 };

/**
 * Layout of each icon of `APP_ICONS` (`src/utils/icons.ts`), by role: a tile with rounded corners
 * for those shown as they are, the favicons with a larger logo; a square that fills the icon for
 * those that the system crops to its own shape, iOS rounding the corners of the Apple touch icon,
 * and Android cropping the maskable icon, whose logo stays in its safe zone.
 * @type {Record<string, import('./utils/logo.mjs').IconLayout>}
 */
export const ICON_LAYOUTS = {
  legacyFavicon: FAVICON_LAYOUT,
  favicon: FAVICON_LAYOUT,
  appleTouch: { shape: 'square', logoWidthRatio: 0.62 },
  small: { shape: 'tile', logoWidthRatio: 0.62 },
  large: { shape: 'tile', logoWidthRatio: 0.62 },
  maskable: {
    shape: 'square',
    logoWidthRatio: 0.5,
    safeZoneRadiusRatio: MASKABLE_SAFE_ZONE_RADIUS_RATIO,
  },
};

/**
 * Font size at which the script checks the outline of the logo against its text drawn by Chromium
 * in its font, in pixels: large enough for the anti-aliased edges to be a small share of the logo.
 */
export const OUTLINE_CHECK_FONT_SIZE_PX = 400;

/** Space around the logo in the canvas of that check, in pixels. */
export const OUTLINE_CHECK_MARGIN_PX = 8;

/**
 * Opacity, from 0 to 255, from which a pixel of the canvas of that check counts as ink: half
 * covered, as the edge of a shape.
 */
export const INK_ALPHA_THRESHOLD = 128;

/**
 * Largest share of the inked pixels where the outline of the logo and its text may differ, along
 * their anti-aliased edges. A glyph read wrong differs on a far larger share.
 */
export const MAX_OUTLINE_MISMATCH_RATIO = 0.02;
