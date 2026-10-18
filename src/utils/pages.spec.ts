import { statSync } from 'node:fs';

import { LANGUAGES } from '../i18n/constants';
import {
  NOT_FOUND_FOLDER,
  OG_IMAGE_PATHS,
  PAGES,
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
