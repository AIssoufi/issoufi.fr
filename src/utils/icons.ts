/**
 * An icon of the site: a file of `public/` that `pnpm icons` (`scripts/icons/`) draws from the
 * "AI" logo of the header, written as one whole absolute URL, which the standalone build makes
 * relative to its page.
 */
export interface AppIcon {
  /** Absolute URL of the file, e.g. `/icon-192.png`. */
  url: string;
  /** Media type of the file, e.g. `image/png`. */
  type: string;
  /**
   * Width and height of the image, in pixels, the size that its link declares. Left out for a
   * vector image, sharp at any size.
   */
  sizePx?: number;
}

/**
 * Icons of the site, by role. Every page links the favicons and the Apple touch icon from
 * `index.html`, and the web app manifest of each language lists the icons of the installed app
 * (see `renderWebManifest`). `pnpm icons` writes each file, in the layout its role needs
 * (`ICON_LAYOUTS` of `scripts/icons/constants.mjs`).
 */
export const APP_ICONS = {
  /**
   * Favicon of the browsers that read no SVG one, such as Safari before version 26: the logo at
   * 16, 32 and 48 px in one file, its link declaring 32 px, so that the others prefer the SVG.
   */
  legacyFavicon: { url: '/favicon.ico', type: 'image/x-icon', sizePx: 32 },
  /** Favicon of the tabs and bookmarks, sharp at any size. */
  favicon: { url: '/favicon.svg', type: 'image/svg+xml' },
  /** Icon of the home screen of iOS and iPadOS, whose corners they round themselves. */
  appleTouch: { url: '/apple-touch-icon.png', type: 'image/png', sizePx: 180 },
  /** Icon of the installed app, at the smallest size that Chrome requires. */
  small: { url: '/icon-192.png', type: 'image/png', sizePx: 192 },
  /** Icon of the installed app and of its splash screen, at the largest size that Chrome uses. */
  large: { url: '/icon-512.png', type: 'image/png', sizePx: 512 },
  /**
   * Icon that Android crops to the shape of the home screen of the device: the logo stays in its
   * safe zone, the circle of 80 % of its width at its center.
   */
  maskable: { url: '/icon-maskable-512.png', type: 'image/png', sizePx: 512 },
} as const satisfies Record<string, AppIcon>;
