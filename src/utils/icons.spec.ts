// @vitest-environment node
import { readFileSync, statSync } from 'node:fs';

import { APP_ICONS } from './icons';

/** First bytes of every PNG file: its signature. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Offsets of the width and height of a PNG file, in its IHDR chunk, right after its signature. */
const PNG_WIDTH_OFFSET_BYTES = 16;
const PNG_HEIGHT_OFFSET_BYTES = 20;

/** Size of the header of an ICO file and of each entry of its directory, in bytes. */
const ICO_HEADER_BYTES = 6;
const ICO_ENTRY_BYTES = 16;

/** Sizes of the images of the ICO favicon, as `pnpm icons` draws them. */
const ICO_SIZES_PX = [16, 32, 48];

/** Reads a file of `public/` from its absolute URL. */
const readPublicFile = (url: string) => readFileSync(`public${url}`);

/** Reads the width and height of a PNG file. */
const readPngSize = (png: Buffer) => ({
  width: png.readUInt32BE(PNG_WIDTH_OFFSET_BYTES),
  height: png.readUInt32BE(PNG_HEIGHT_OFFSET_BYTES),
});

/** Reads the size and the PNG file of each image of an ICO file. */
const readIcoImages = (ico: Buffer) =>
  Array.from({ length: ico.readUInt16LE(4) }, (_, index) => {
    const entry = ICO_HEADER_BYTES + index * ICO_ENTRY_BYTES;
    const offset = ico.readUInt32LE(entry + 12);
    return {
      size: ico.readUInt8(entry),
      png: ico.subarray(offset, offset + ico.readUInt32LE(entry + 8)),
    };
  });

const pngIcons = Object.entries(APP_ICONS).flatMap(([role, icon]) =>
  icon.type === 'image/png' ? [{ role, url: icon.url, sizePx: icon.sizePx }] : [],
);

describe('APP_ICONS', () => {
  it.each(Object.entries(APP_ICONS).map(([role, { url }]) => ({ role, url })))(
    'names a file of public/ for the $role icon, $url',
    ({ url }) => {
      expect(url).toMatch(/^\/[\w-]+\.(png|svg|ico)$/);
      expect(statSync(`public${url}`).isFile()).toBe(true);
    },
  );

  it.each(pngIcons)('draws the $role icon as a PNG of $sizePx px', ({ url, sizePx }) => {
    const png = readPublicFile(url);

    expect(png.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
    expect(readPngSize(png)).toEqual({ width: sizePx, height: sizePx });
  });

  it('draws the favicon as vector paths, which need no font nor any other file', () => {
    const svg = readPublicFile(APP_ICONS.favicon.url).toString('utf-8');

    expect(svg).toMatch(
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]* viewBox="0 0 (\d+) \1"/,
    );
    expect(svg).toContain('<path d="M');
    expect(svg).not.toMatch(/<text|<image|href=|url\(/);
  });

  it('holds the older favicon at each size of the tabs, the size of its link included', () => {
    const images = readIcoImages(readPublicFile(APP_ICONS.legacyFavicon.url));

    expect(images.map(({ size }) => size)).toEqual(ICO_SIZES_PX);
    expect(ICO_SIZES_PX).toContain(APP_ICONS.legacyFavicon.sizePx);
    images.forEach(({ size, png }) => {
      expect(png.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
      expect(readPngSize(png)).toEqual({ width: size, height: size });
    });
  });

  it('gives Chrome the icon sizes it needs to install the site as an app', () => {
    expect(pngIcons.map(({ sizePx }) => sizePx)).toEqual(expect.arrayContaining([192, 512]));
  });

  it('gives iOS an Apple touch icon of the size of its home screen', () => {
    expect(APP_ICONS.appleTouch.sizePx).toBe(180);
  });

  it('keeps the icons light, as they are small images of a few shapes', () => {
    Object.values(APP_ICONS).forEach(({ url }) => {
      expect(statSync(`public${url}`).size, url).toBeLessThan(20_000);
    });
  });
});
