import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { readWebpSize } from './publicFileTestUtils.ts';

/** Folder of the images that the README and the guides of `docs/` show. */
const DOCS_IMAGES_DIR = join('docs', 'images');

/** Width of the screenshot of the home page, captured as `docs/assets.md` says. */
const HOME_SCREENSHOT_WIDTH_PX = 1440;
/** Height of the screenshot of the home page, the height of a laptop screen. */
const HOME_SCREENSHOT_HEIGHT_PX = 900;
/**
 * Heaviest screenshot of the home page: about 40 kB once written with `cwebp`, with room for a page
 * that draws a little more.
 */
const HOME_SCREENSHOT_MAX_BYTES = 50_000;

/** Whether a file name is hidden, such as the `.DS_Store` that Finder writes and git ignores. */
const isHiddenFile = (fileName: string) => fileName.startsWith('.');

/** The size and the weight that each image of `docs/images/` keeps. */
const DOCS_IMAGES = [
  {
    fileName: 'home.webp',
    width: HOME_SCREENSHOT_WIDTH_PX,
    height: HOME_SCREENSHOT_HEIGHT_PX,
    maxBytes: HOME_SCREENSHOT_MAX_BYTES,
  },
];

describe('docs/images', () => {
  it('gives every image a size and a weight to keep', () => {
    const fileNames = DOCS_IMAGES.map(({ fileName }) => fileName);

    const imageFileNames = readdirSync(DOCS_IMAGES_DIR).filter(fileName => !isHiddenFile(fileName));

    expect(imageFileNames.sort()).toEqual(fileNames.sort());
  });

  it.each(DOCS_IMAGES)(
    'keeps $fileName at $width × $height px and at most $maxBytes bytes',
    ({ fileName, width, height, maxBytes }) => {
      const file = join(DOCS_IMAGES_DIR, fileName);

      expect(readWebpSize(readFileSync(file))).toEqual({ width, height });
      expect(statSync(file).size).toBeLessThanOrEqual(maxBytes);
    },
  );
});
