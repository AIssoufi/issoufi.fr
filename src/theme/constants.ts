import type { FontFaceDeclaration } from './types';

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
 * Web fonts of the site, which it serves itself from `public/fonts/`, next to their licenses
 * (`*-OFL.txt`), so that no page requests Google. The files are the `latin` subsets that Google
 * Fonts served to Windows and Linux, byte for byte, with their hinting: macOS, iOS and Android
 * ignore it, so every system draws the text as before. The `font-faces` plugin of
 * `vite.config.ts` declares them in the head of every page, and preloads both files, since every
 * page shows text in both fonts. `pnpm og-image` reads the files as data URLs, and the standalone
 * build embeds them the same way: keep their names and their folder, which other scripts read.
 * The weights and styles describe the files, as Google Fonts declared them, not a design choice.
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
  {
    family: 'Saira Stencil One',
    url: '/fonts/saira-stencil-one-latin.woff2',
    weight: '400',
    style: 'normal',
    unicodeRange: LATIN_UNICODE_RANGE,
  },
];

/**
 * Media query of the visitors who asked their system to reduce motion, for instance because of a
 * vestibular disorder. With it, `GlobalStyle` makes every animation and transition instant, and
 * the effects that follow the pointer or loop in JavaScript stand still (`usePrefersReducedMotion`,
 * `src/hooks`).
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
