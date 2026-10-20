// @vitest-environment node
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import {
  LOGO_OUTLINE,
  LOGO_TEXT as HEADER_LOGO_TEXT,
} from '../../src/App/Header/Logo/constants.ts';
import { LOGO_FONT_FACE } from '../../src/theme/constants.ts';
import { theme } from '../../src/theme/theme.ts';
import { APP_ICONS } from '../../src/utils/icons.ts';
import { LOGO_TEXT, PUBLIC_DIR } from '../utils/constants.mjs';
import { HEADER_LOGO_FILE, ICO_SIZES_PX, LOGO_LETTER_SPACING } from './constants.mjs';
import { readIcoImages } from './utils/ico.mjs';
import { getHeaderLogo, layoutLogo, parseEmLength } from './utils/logo.mjs';
import { readGlyphOutlines } from './utils/woff2.mjs';

/** First bytes of every PNG file: its signature. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Offsets of the width and height of a PNG file, in its IHDR chunk, right after its signature. */
const PNG_WIDTH_OFFSET_BYTES = 16;
const PNG_HEIGHT_OFFSET_BYTES = 20;

/**
 * Largest size of each icon file, in bytes: a few flat shapes, which weighed from 375 bytes to
 * 10 kB in October 2026. A heavier file means a photo-like or uncompressed image.
 */
const MAX_ICON_FILE_BYTES = 20_000;

/** Reads a file of `public/` from its absolute URL. */
const readPublicFile = url => readFileSync(join(PUBLIC_DIR, url));

/** Reads the width and height of a PNG file. */
const readPngSize = png => ({
  width: png.readUInt32BE(PNG_WIDTH_OFFSET_BYTES),
  height: png.readUInt32BE(PNG_HEIGHT_OFFSET_BYTES),
});

const pngIcons = Object.entries(APP_ICONS)
  .filter(([, { type }]) => type === 'image/png')
  .map(([role, { url, sizePx }]) => ({ role, url, sizePx }));

// The icons are generated on demand by `pnpm icons`, which needs Chromium: these checks read the
// committed files, so an icon of APP_ICONS that is missing or of another size fails here
describe('the icons of public/', () => {
  it.each(Object.entries(APP_ICONS).map(([role, { url }]) => ({ role, url })))(
    'hold the $role icon, $url',
    ({ url }) => {
      expect(url).toMatch(/^\/[\w-]+\.(png|svg|ico)$/);
      expect(statSync(join(PUBLIC_DIR, url)).isFile()).toBe(true);
    },
  );

  it.each(pngIcons)('draw the $role icon as a PNG of $sizePx px', ({ url, sizePx }) => {
    const png = readPublicFile(url);

    expect(png.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
    expect(readPngSize(png)).toEqual({ width: sizePx, height: sizePx });
  });

  it('draw the favicon as vector paths, which need no font nor any other file', () => {
    const svg = readPublicFile(APP_ICONS.favicon.url).toString('utf-8');

    expect(svg).toMatch(
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]* viewBox="0 0 (\d+) \1"/,
    );
    expect(svg).toContain('<path d="M');
    expect(svg).not.toMatch(/<text|<image|href=|url\(/);
  });

  it('hold the older favicon at each size of the tabs, the size of its link included', () => {
    const images = readIcoImages(readPublicFile(APP_ICONS.legacyFavicon.url));

    expect(images.map(({ size }) => size)).toEqual(ICO_SIZES_PX);
    expect(ICO_SIZES_PX).toContain(APP_ICONS.legacyFavicon.sizePx);
    images.forEach(({ size, png }) => {
      expect(png.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
      expect(readPngSize(png)).toEqual({ width: size, height: size });
    });
  });

  it('give Chrome the icon sizes it needs to install the site as an app', () => {
    expect(pngIcons.map(({ sizePx }) => sizePx)).toEqual(expect.arrayContaining([192, 512]));
  });

  it('give iOS an Apple touch icon of the size of its home screen', () => {
    expect(APP_ICONS.appleTouch.sizePx).toBe(180);
  });

  it('stay light, as they are small images of a few shapes', () => {
    Object.values(APP_ICONS).forEach(({ url }) => {
      expect(statSync(join(PUBLIC_DIR, url)).size, url).toBeLessThan(MAX_ICON_FILE_BYTES);
    });
  });
});

// Like the icons, the logo of the header is drawn by `pnpm icons`: a change of its font or of its
// letter spacing without a new run fails here
describe('the logo of the header', () => {
  it('draws the outline of the logo in its font, with its letter spacing', () => {
    const outlines = readGlyphOutlines({
      file: readPublicFile(LOGO_FONT_FACE.url),
      text: LOGO_TEXT,
    });
    const logo = layoutLogo({
      outlines,
      letterSpacingEm: parseEmLength(theme.letterSpacings[LOGO_LETTER_SPACING]),
    });

    expect(LOGO_OUTLINE).toEqual(getHeaderLogo({ outlines, logo }));
  });

  it('is the file that the script writes, named after the text that it draws', () => {
    expect(JSON.parse(readFileSync(HEADER_LOGO_FILE, 'utf-8'))).toEqual(LOGO_OUTLINE);
    expect(HEADER_LOGO_TEXT).toBe(LOGO_TEXT);
  });
});
