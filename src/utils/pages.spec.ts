import { readFileSync, statSync } from 'node:fs';

import { LANGUAGES } from '../i18n/constants';
import { theme } from '../theme/theme';
import {
  EXPERIENCES_PAGE,
  HOME_PAGE,
  NOT_FOUND_FOLDER,
  OG_IMAGE_PATHS,
  PAGES,
  PORTRAIT_PHOTO_MEDIA_QUERY,
  PROJECTS_PAGE,
  STATUS_PAGE_BACKGROUND_PHOTO,
  getLanguageFileName,
  getNotFoundFiles,
  getOgImageUrl,
  getPage,
  getPageAlternates,
  getPageFiles,
  getPageUrl,
  isTemplatePageFile,
} from './pages';

const [home, projects, experiences] = PAGES;

/**
 * Heaviest portrait version of a background photo: on the throttled phone network of the audit,
 * 1.6 Mbit/s, it downloads in 0.2 s, so the photo shows with the text of the page.
 */
const PORTRAIT_PHOTO_MAX_BYTES = 40_000;

/**
 * Heaviest whole background photo, which wide screens preload with the scripts and fonts of the
 * page: the projects and experiences photos weighed 148 and 179 kB before they were re-encoded.
 */
const WHOLE_PHOTO_MAX_BYTES = 110_000;

/** Widest whole background photo: wider screens show it a little enlarged, under the overlay. */
const WHOLE_PHOTO_MAX_WIDTH_PX = 1920;

/** Width over height of the portrait version of a background photo: 3:4. */
const PORTRAIT_PHOTO_ASPECT_RATIO = 3 / 4;

/** Pixels by which the width of a portrait version may differ from its 3:4 width, when rounded. */
const PORTRAIT_PHOTO_ROUNDING_PX = 1;

/** Offset of the type of the first chunk of a WebP file, after its RIFF header. */
const WEBP_CHUNK_TYPE_OFFSET_BYTES = 12;

/** Bytes of the type of a chunk of a WebP file, such as `VP8 `. */
const WEBP_CHUNK_TYPE_BYTES = 4;

/** Offsets of the width and height of a lossy WebP file without extended header (`VP8 `). */
const WEBP_LOSSY_WIDTH_OFFSET_BYTES = 26;
const WEBP_LOSSY_HEIGHT_OFFSET_BYTES = 28;

/** Bits of a 16-bit field of a lossy WebP file that hold the width or height, without the scale. */
const WEBP_LOSSY_SIZE_MASK = 0x3fff;

/** Offsets of the canvas width and height, minus one, in an extended WebP file (`VP8X`). */
const WEBP_EXTENDED_WIDTH_OFFSET_BYTES = 24;
const WEBP_EXTENDED_HEIGHT_OFFSET_BYTES = 27;

/** Bytes of the canvas width and height of an extended WebP file. */
const WEBP_EXTENDED_SIZE_BYTES = 3;

/**
 * Reads the width and height of a WebP file of `public/` in its header, lossy (`VP8 `) or extended
 * (`VP8X`). Returns `undefined` for any other kind of WebP file.
 */
const readWebpSize = (url: string) => {
  const webp = readFileSync(`public${url}`);
  const chunkType = webp.toString(
    'ascii',
    WEBP_CHUNK_TYPE_OFFSET_BYTES,
    WEBP_CHUNK_TYPE_OFFSET_BYTES + WEBP_CHUNK_TYPE_BYTES,
  );

  if (chunkType === 'VP8 ') {
    return {
      width: webp.readUInt16LE(WEBP_LOSSY_WIDTH_OFFSET_BYTES) & WEBP_LOSSY_SIZE_MASK,
      height: webp.readUInt16LE(WEBP_LOSSY_HEIGHT_OFFSET_BYTES) & WEBP_LOSSY_SIZE_MASK,
    };
  }
  if (chunkType === 'VP8X') {
    return {
      width: webp.readUIntLE(WEBP_EXTENDED_WIDTH_OFFSET_BYTES, WEBP_EXTENDED_SIZE_BYTES) + 1,
      height: webp.readUIntLE(WEBP_EXTENDED_HEIGHT_OFFSET_BYTES, WEBP_EXTENDED_SIZE_BYTES) + 1,
    };
  }
  return undefined;
};

describe('getPage', () => {
  it('finds the page matching the path', () => {
    expect(getPage('/')).toBe(home);
    expect(getPage('/projects')).toBe(projects);
    expect(getPage('/experiences')).toBe(experiences);
  });

  it('ignores a trailing slash', () => {
    expect(getPage('/projects/')).toBe(projects);
  });

  it('finds the page of an English path', () => {
    expect(getPage('/en/')).toBe(home);
    expect(getPage('/en')).toBe(home);
    expect(getPage('/en/projects')).toBe(projects);
    expect(getPage('/en/experiences/')).toBe(experiences);
  });

  it('returns undefined for unknown paths', () => {
    expect(getPage('/skills')).toBeUndefined();
    expect(getPage('/projects/inconnu')).toBeUndefined();
    expect(getPage('/en/skills')).toBeUndefined();
    expect(getPage('/fr/projects')).toBeUndefined();
  });
});

describe('getLanguageFileName', () => {
  it('keeps the files of the default language at the root of the build', () => {
    expect(getLanguageFileName({ fileName: 'index.html', language: 'fr' })).toBe('index.html');
    expect(getLanguageFileName({ fileName: '404.html', language: 'fr' })).toBe('404.html');
  });

  it('puts the files of another language in the folder of its prefix', () => {
    expect(getLanguageFileName({ fileName: 'index.html', language: 'en' })).toBe('en/index.html');
    expect(getLanguageFileName({ fileName: 'projects.html', language: 'en' })).toBe(
      'en/projects.html',
    );
  });

  it('keeps a file of an unknown language at the root, as the default language', () => {
    expect(getLanguageFileName({ fileName: 'index.html', language: 'de' as never })).toBe(
      'index.html',
    );
  });
});

describe('getPageFiles', () => {
  it('lists every page in every language, language by language', () => {
    expect(getPageFiles().map(({ language, fileName }) => [language, fileName])).toEqual([
      ['fr', 'index.html'],
      ['fr', 'projects.html'],
      ['fr', 'experiences.html'],
      ['en', 'en/index.html'],
      ['en', 'en/projects.html'],
      ['en', 'en/experiences.html'],
    ]);
  });

  it('gives each file the page it shows', () => {
    expect(getPageFiles().map(({ page }) => page)).toEqual([...PAGES, ...PAGES]);
  });
});

describe('getNotFoundFiles', () => {
  it('lists a not found page per language, in the folder of its prefix', () => {
    expect(getNotFoundFiles()).toEqual([
      { language: 'fr', fileName: '404.html' },
      { language: 'en', fileName: 'en/404.html' },
    ]);
  });
});

describe('getPageUrl', () => {
  it.each([
    ['/', 'fr', 'https://issoufi.fr/'],
    ['/projects', 'fr', 'https://issoufi.fr/projects'],
    ['/', 'en', 'https://issoufi.fr/en/'],
    ['/experiences', 'en', 'https://issoufi.fr/en/experiences'],
  ] as const)('gives %s in %s the URL %s', (path, language, url) => {
    expect(getPageUrl({ path, language })).toBe(url);
  });
});

describe('getPageAlternates', () => {
  it('lists the page in every language, then in the default language as x-default', () => {
    expect(getPageAlternates('/projects')).toEqual([
      { hreflang: 'fr', href: 'https://issoufi.fr/projects' },
      { hreflang: 'en', href: 'https://issoufi.fr/en/projects' },
      { hreflang: 'x-default', href: 'https://issoufi.fr/projects' },
    ]);
  });

  it('lists the home page of each language at the folder of its prefix', () => {
    expect(getPageAlternates('/')).toEqual([
      { hreflang: 'fr', href: 'https://issoufi.fr/' },
      { hreflang: 'en', href: 'https://issoufi.fr/en/' },
      { hreflang: 'x-default', href: 'https://issoufi.fr/' },
    ]);
  });

  it('gives the same translations from the path of any language', () => {
    expect(getPageAlternates('/en/experiences')).toEqual(getPageAlternates('/experiences'));
  });

  it('gives the translations of the home page for an empty path', () => {
    expect(getPageAlternates('')).toEqual(getPageAlternates('/'));
  });

  it('lists every language once, plus x-default', () => {
    const hreflangs = getPageAlternates('/projects').map(({ hreflang }) => hreflang);

    expect(hreflangs).toEqual([...LANGUAGES, 'x-default']);
  });
});

describe('getOgImageUrl', () => {
  it.each([
    ['fr', 'https://issoufi.fr/og-image.jpg'],
    ['en', 'https://issoufi.fr/og-image-en.jpg'],
  ] as const)('gives the %s image the URL %s', (language, url) => {
    expect(getOgImageUrl(language)).toBe(url);
  });

  it('gives each language its own image', () => {
    const urls = LANGUAGES.map(getOgImageUrl);

    expect(new Set(urls).size).toBe(LANGUAGES.length);
  });

  it.each(['de', 'EN', '', undefined, null, 42])(
    'gives the default language image for %j, which is not a language of the site',
    language => {
      expect(getOgImageUrl(language)).toBe('https://issoufi.fr/og-image.jpg');
    },
  );
});

describe('OG_IMAGE_PATHS', () => {
  it.each(Object.entries(OG_IMAGE_PATHS))('names a file of public/ for %s: %s', (_, path) => {
    expect(statSync(`public${path}`).isFile()).toBe(true);
  });
});

describe('PAGES', () => {
  it('lists the home, projects and experiences pages, in the order of the menu', () => {
    expect(PAGES).toEqual([HOME_PAGE, PROJECTS_PAGE, EXPERIENCES_PAGE]);
  });

  it('gives each page its own background photo', () => {
    const urls = PAGES.flatMap(({ backgroundPhoto }) => Object.values(backgroundPhoto));

    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe('background photos', () => {
  const photos = [
    ...PAGES.map(({ folder, backgroundPhoto }) => ({ folder, ...backgroundPhoto })),
    { folder: 'the status pages', ...STATUS_PAGE_BACKGROUND_PHOTO },
  ];

  it.each(photos)(
    'names files of public/ for $folder: $url, $portraitUrl',
    ({ url, portraitUrl }) => {
      expect(statSync(`public${url}`).isFile()).toBe(true);
      expect(statSync(`public${portraitUrl}`).isFile()).toBe(true);
    },
  );

  it.each(photos)(
    'gives $folder a portrait version lighter than the photo, under the budget of phones',
    ({ url, portraitUrl }) => {
      const portraitBytes = statSync(`public${portraitUrl}`).size;

      expect(portraitBytes).toBeLessThan(statSync(`public${url}`).size);
      expect(portraitBytes).toBeLessThanOrEqual(PORTRAIT_PHOTO_MAX_BYTES);
    },
  );

  it.each(photos)('keeps the whole photo of $folder light and at most 1920 px wide', ({ url }) => {
    expect(statSync(`public${url}`).size).toBeLessThanOrEqual(WHOLE_PHOTO_MAX_BYTES);
    expect(readWebpSize(url)?.width).toBeLessThanOrEqual(WHOLE_PHOTO_MAX_WIDTH_PX);
  });

  it.each(photos)(
    'gives $folder a portrait version in 3:4, no taller than the photo',
    ({ url, portraitUrl }) => {
      const photo = readWebpSize(url);
      const portrait = readWebpSize(portraitUrl);
      const expectedWidth = (portrait?.height ?? 0) * PORTRAIT_PHOTO_ASPECT_RATIO;

      expect(portrait?.height).toBeGreaterThan(0);
      expect(Math.abs((portrait?.width ?? 0) - expectedWidth)).toBeLessThanOrEqual(
        PORTRAIT_PHOTO_ROUNDING_PX,
      );
      expect(portrait?.height).toBeLessThanOrEqual(photo?.height ?? 0);
    },
  );

  it('shows the portrait versions on portrait screens under the tablet breakpoint', () => {
    expect(PORTRAIT_PHOTO_MEDIA_QUERY).toBe(
      `(orientation: portrait) and (width < ${theme.screens.tablet})`,
    );
  });
});

describe('page folders', () => {
  it.each([...PAGES.map(({ folder }) => folder), NOT_FOUND_FOLDER])(
    'name a page of src/pages with an index file: %s',
    folder => {
      expect(statSync(`src/pages/${folder}/index.ts`).isFile()).toBe(true);
    },
  );
});

describe('isTemplatePageFile', () => {
  it('sees index.html, the home page of the default language, as the template file', () => {
    expect(getPageFiles().filter(isTemplatePageFile)).toEqual([
      { page: home, language: 'fr', fileName: 'index.html' },
    ]);
  });

  it('sees the English home page as a file to emit', () => {
    expect(isTemplatePageFile({ page: home, language: 'en', fileName: 'en/index.html' })).toBe(
      false,
    );
  });

  it('sees the other French pages as files to emit', () => {
    expect(isTemplatePageFile({ page: projects, language: 'fr', fileName: 'projects.html' })).toBe(
      false,
    );
  });
});
