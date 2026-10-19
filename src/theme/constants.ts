import type { FontFaceDeclaration } from './types.ts';

/**
 * Characters of the `latin` subset of Google Fonts, the subset of the font files of
 * `public/fonts/`: ASCII and Latin-1 (French accents, `«»`, no-break space), `œ`, the
 * punctuation of U+2000-206F (`’`, `…`, `—`, narrow no-break space) and `€`. The browser draws
 * the other characters, such as `→`, in the next font of the stack, as it did when Google Fonts
 * served the same files.
 */
export const LATIN_UNICODE_RANGE =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, ' +
  'U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

/** Format of the font files of {@link FONT_FACES}, written after their URL. */
export const FONT_FILE_FORMAT = 'woff2';

/**
 * Media type of the font files of {@link FONT_FACES}: the `type` of the links that preload them,
 * and the type of their data URLs.
 */
export const FONT_MEDIA_TYPE = 'font/woff2';

/**
 * How a page shows a text before its font file is loaded: in the next font of the stack, swapped
 * for the web font once loaded, as the `display=swap` of Google Fonts did.
 */
export const FONT_DISPLAY = 'swap';

/**
 * Web fonts of the pages, which the site serves itself from `public/fonts/`, next to their
 * licenses (`*-OFL.txt`), so that no page requests Google. The files are the `latin` subsets that
 * Google Fonts served to Windows and Linux, byte for byte, with their hinting: macOS, iOS and
 * Android ignore it, so every system draws the text as before. The `font-faces` plugin of
 * `vite.config.ts` declares them in the head of every page, and preloads their files, since every
 * page shows text in them. `pnpm og-image` reads the files as data URLs, and the standalone build
 * embeds them the same way: keep their names and their folder, which other scripts read. The
 * weights and styles describe the files, as Google Fonts declared them, not a design choice.
 */
export const FONT_FACES: readonly FontFaceDeclaration[] = [
  {
    family: 'Montserrat',
    url: '/fonts/montserrat-latin.woff2',
    // A variable font: one file draws every weight, up to the 900 of a <strong> in bold text
    weight: '100 900',
    style: 'normal',
    unicodeRange: LATIN_UNICODE_RANGE,
  },
];

/**
 * Web font of the logo, the display font of the theme, which no page loads for its two letters:
 * the header draws the logo as their outline, which `pnpm icons` writes from this file with the
 * icons, and `pnpm og-image` draws the logo in it. Its file sits with the other fonts in
 * `public/fonts/`, next to its license, as Google Fonts served it.
 */
export const LOGO_FONT_FACE: FontFaceDeclaration = {
  family: 'Saira Stencil One',
  url: '/fonts/saira-stencil-one-latin.woff2',
  weight: '400',
  style: 'normal',
  unicodeRange: LATIN_UNICODE_RANGE,
};

/**
 * Media query of the visitors who asked their system to reduce motion, for instance because of a
 * vestibular disorder. With it, `GlobalStyle` makes every animation and transition instant, and
 * the effects that follow the pointer or loop in JavaScript stand still (`usePrefersReducedMotion`,
 * `src/hooks`).
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Media query of the screens whose main pointer hovers, precisely, such as a mouse or a trackpad.
 * Every `:hover` of the styles sits in a block of it, alone or after other conditions
 * (`@media (min-width: …) and ${HOVER_POINTER_QUERY}`), which `theme.spec.jsx` checks: a touch
 * screen keeps the hover style of the last control tapped until the next tap elsewhere, so it
 * gets none, and keeps the `:active` and `:focus-visible` styles.
 */
export const HOVER_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

/**
 * Media query of forced colors mode, such as a contrast theme of Windows, which draws the texts and
 * the borders in the colors of its palette and removes the backgrounds and the shadows: a state
 * that only they show gets a system color in a block of it (`forced-active`, `forced-icon`).
 */
export const FORCED_COLORS_QUERY = '(forced-colors: active)';

/**
 * Media query of the browsers that run no script, as when the visitor turned JavaScript off: the
 * page that the build rendered stays as it is, and CSS stands in for the controls that need a
 * script, such as the burger button of the mobile menu. It decides before the first paint, so a
 * page that runs scripts never shows these styles. Browsers that do not know it never match it,
 * as Safari before 17 and Chrome before 120.
 */
export const NO_SCRIPT_QUERY = '(scripting: none)';

/**
 * Smallest font size of the site, in pixels: the size of its metadata (dates, badges, tags, the
 * version of the build), under which a text gets hard to read. `theme.spec.jsx` checks every font
 * size of the theme against it, and `readable-text.e2e.ts` every text that a page shows.
 */
export const MIN_FONT_SIZE_PX = 12;
