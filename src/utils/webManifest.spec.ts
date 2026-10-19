// @vitest-environment node
import { LANGUAGES } from '../i18n/constants';
import type { Language } from '../i18n/types';
import { APP_ICONS } from './icons';
import {
  findWebManifestLanguage,
  getWebManifestFiles,
  getWebManifestUrl,
  renderWebManifest,
  WEB_MANIFEST_FILE_NAME,
} from './webManifest';

/**
 * Longest short name, in characters, that the home screens of Android and iOS show without cutting
 * it, as web.dev recommends it.
 */
const MAX_SHORT_NAME_CHARACTERS = 12;

/** Years of experience that the manifests of the tests give, unless a test says otherwise. */
const EXPERIENCE_YEARS = 8;

/** Parameters of {@link readManifest}. */
interface ReadManifestParams {
  /** Language of the manifest. */
  language: Language;
  /** Years of experience that the description of the manifest gives. */
  years?: number;
}

/** Reads the manifest of a language as an object. */
const readManifest = ({ language, years = EXPERIENCE_YEARS }: ReadManifestParams) =>
  JSON.parse(renderWebManifest({ language, years }));

describe('getWebManifestUrl', () => {
  it('serves the manifest of the default language at the root', () => {
    expect(getWebManifestUrl('fr')).toBe('/manifest.webmanifest');
  });

  it('serves the manifest of another language in the folder of its prefix', () => {
    expect(getWebManifestUrl('en')).toBe('/en/manifest.webmanifest');
  });

  it.each([undefined, null, '', 'de', 'EN', 42, {}])(
    'gives the manifest of the default language for %o',
    language => {
      expect(getWebManifestUrl(language)).toBe('/manifest.webmanifest');
    },
  );
});

describe('getWebManifestFiles', () => {
  it('names a manifest per language, under the URL that its pages link', () => {
    expect(getWebManifestFiles()).toEqual([
      { language: 'fr', fileName: WEB_MANIFEST_FILE_NAME },
      { language: 'en', fileName: `en/${WEB_MANIFEST_FILE_NAME}` },
    ]);
    getWebManifestFiles().forEach(({ language, fileName }) => {
      expect(getWebManifestUrl(language)).toBe(`/${fileName}`);
    });
  });
});

describe('findWebManifestLanguage', () => {
  it.each([
    ['/manifest.webmanifest', 'fr'],
    ['/en/manifest.webmanifest', 'en'],
    ['/en/manifest.webmanifest?v=2', 'en'],
    ['/manifest.webmanifest#icons', 'fr'],
  ])('finds the language of %s', (url, language) => {
    expect(findWebManifestLanguage(url)).toBe(language);
  });

  it.each([
    '/',
    '/en/',
    '/manifest.json',
    '/fr/manifest.webmanifest',
    '/de/manifest.webmanifest',
    'manifest.webmanifest',
    '/en/manifest.webmanifest/',
    '/projects/manifest.webmanifest',
    '',
  ])('finds none for %j, which is no manifest of the site', url => {
    expect(findWebManifestLanguage(url)).toBeUndefined();
  });

  it.each([undefined, null, 42, {}, ['/manifest.webmanifest']])('finds none for %o', url => {
    expect(findWebManifestLanguage(url)).toBeUndefined();
  });
});

describe('renderWebManifest', () => {
  it('describes the French site, opening on the French home page', () => {
    expect(readManifest({ language: 'fr' })).toEqual({
      id: '/',
      lang: 'fr',
      dir: 'ltr',
      name: 'ADAM Issoufi - Développeur full-stack JavaScript',
      short_name: 'ADAM Issoufi',
      description: 'Développeur full-stack JavaScript avec 8 ans d’expérience, spécialisé React.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      theme_color: '#000000',
      background_color: '#000000',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: '/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    });
  });

  it('describes the English site, opening on the English home page', () => {
    expect(readManifest({ language: 'en', years: 9 })).toMatchObject({
      lang: 'en',
      dir: 'ltr',
      name: 'ADAM Issoufi - Full-stack JavaScript Developer',
      short_name: 'ADAM Issoufi',
      description:
        'Full-stack JavaScript developer with 9 years of experience, specializing in React.',
      start_url: '/en/',
    });
  });

  it('installs every language as the same app, which opens any page of the site', () => {
    const manifests = LANGUAGES.map(language => readManifest({ language }));

    manifests.forEach(manifest => {
      expect(manifest.id).toBe('/');
      expect(manifest.scope).toBe('/');
      expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);
    });
  });

  it('keeps a short name that the home screens show whole', () => {
    LANGUAGES.forEach(language => {
      expect(readManifest({ language }).short_name.length).toBeLessThanOrEqual(
        MAX_SHORT_NAME_CHARACTERS,
      );
    });
  });

  it('lists the icons that Chrome needs to install the app, with absolute URLs', () => {
    const { icons } = readManifest({ language: 'en' });
    const anyPurposeSizes = icons
      .filter(({ purpose }: { purpose: string }) => purpose === 'any')
      .map(({ sizes }: { sizes: string }) => sizes);

    expect(anyPurposeSizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(icons.filter(({ purpose }: { purpose: string }) => purpose === 'maskable')).toEqual([
      expect.objectContaining({ src: APP_ICONS.maskable.url }),
    ]);
    icons.forEach(({ src }: { src: string }) => expect(src).toMatch(/^\/[^/]/));
  });

  it('ends with a line break', () => {
    expect(renderWebManifest({ language: 'fr', years: EXPERIENCE_YEARS })).toMatch(/\}\n$/);
  });

  it.each([undefined, 'de' as Language])(
    'describes the site in the default language for the language %o',
    language => {
      expect(JSON.parse(renderWebManifest({ language, years: EXPERIENCE_YEARS }))).toEqual(
        readManifest({ language: 'fr' }),
      );
    },
  );
});
