import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { FONT_FACES } from './constants';
import { theme } from './theme';

/** Folder whose files the site serves at its root. */
const PUBLIC_DIR = 'public';

/** First bytes of every `woff2` file. */
const WOFF2_SIGNATURE = 'wOF2';

/**
 * License shipped next to the files of each family, in `public/fonts/`: a new font needs its
 * own here, so that its license is served with it.
 */
const LICENSE_FILES: Record<string, string> = {
  Montserrat: 'montserrat-OFL.txt',
  'Saira Stencil One': 'saira-stencil-one-OFL.txt',
};

/** Reads the first family of a CSS font stack, without its quotes. */
const getFirstFamily = (stack: string) =>
  stack
    .split(',')[0]
    .trim()
    .replace(/^['"]|['"]$/g, '');

describe('FONT_FACES', () => {
  it.each(FONT_FACES)('serves $family from a woff2 file of public/fonts/', ({ url }) => {
    const file = join(PUBLIC_DIR, url);

    expect(url).toMatch(/^\/fonts\/[\w-]+\.woff2$/);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file).subarray(0, WOFF2_SIGNATURE.length).toString()).toBe(WOFF2_SIGNATURE);
  });

  it.each(FONT_FACES)('ships the license of $family next to its file', ({ family, url }) => {
    const licenseFile = join(PUBLIC_DIR, dirname(url), LICENSE_FILES[family] ?? '');

    expect(LICENSE_FILES[family], `license file of ${family}`).toBeDefined();
    expect(readFileSync(licenseFile, 'utf-8')).toContain('SIL Open Font License');
  });

  it.each(FONT_FACES)('declares $family, the first font of a stack of the theme', ({ family }) => {
    const firstFamilies = Object.values(theme.fonts).map(getFirstFamily);

    expect(firstFamilies).toContain(family);
  });

  it.each(['body', 'display'] as const)('declares the %s font of the theme', font => {
    const families = FONT_FACES.map(({ family }) => family);

    expect(families).toContain(getFirstFamily(theme.fonts[font]));
  });

  it('declares each file once', () => {
    const urls = FONT_FACES.map(({ url }) => url);

    expect(new Set(urls).size).toBe(urls.length);
  });
});
