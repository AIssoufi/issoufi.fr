import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { FONT_FACES, LOGO_FONT_FACE } from './constants.ts';
import { theme } from './theme.ts';

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

/** Web fonts of the site: those of the pages, and the one of the logo, which the scripts read. */
const ALL_FONT_FACES = [...FONT_FACES, LOGO_FONT_FACE];

describe('the web fonts of the site', () => {
  it.each(ALL_FONT_FACES)('serve $family from a woff2 file of public/fonts/', ({ url }) => {
    const file = join(PUBLIC_DIR, url);

    expect(url).toMatch(/^\/fonts\/[\w-]+\.woff2$/);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file).subarray(0, WOFF2_SIGNATURE.length).toString()).toBe(WOFF2_SIGNATURE);
  });

  it.each(ALL_FONT_FACES)('ship the license of $family next to its file', ({ family, url }) => {
    const licenseFile = join(PUBLIC_DIR, dirname(url), LICENSE_FILES[family] ?? '');

    expect(LICENSE_FILES[family], `license file of ${family}`).toBeDefined();
    expect(readFileSync(licenseFile, 'utf-8')).toContain('SIL Open Font License');
  });

  it.each(ALL_FONT_FACES)(
    'declare $family, the first font of a stack of the theme',
    ({ family }) => {
      const firstFamilies = Object.values(theme.fonts).map(getFirstFamily);

      expect(firstFamilies).toContain(family);
    },
  );

  it('declare each file once', () => {
    const urls = ALL_FONT_FACES.map(({ url }) => url);

    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe('FONT_FACES', () => {
  it('declares the body font of the theme', () => {
    const families = FONT_FACES.map(({ family }) => family);

    expect(families).toContain(getFirstFamily(theme.fonts.body));
  });

  // The header draws the logo as the outline of its letters: its font would weigh 20 kB for them
  it('leaves out the font of the logo, which no page loads', () => {
    const families = FONT_FACES.map(({ family }) => family);

    expect(families).not.toContain(LOGO_FONT_FACE.family);
  });
});

describe('LOGO_FONT_FACE', () => {
  it('declares the display font of the theme, which draws the logo', () => {
    expect(LOGO_FONT_FACE.family).toBe(getFirstFamily(theme.fonts.display));
  });
});
