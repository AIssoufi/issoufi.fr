// @vitest-environment node
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { build, normalizePath, type Plugin, resolveConfig, type Rollup } from 'vite';

import { isGoogleHost } from './e2e/utils';
import { LANGUAGES } from './src/i18n/constants';
import { en } from './src/i18n/en';
import { fr } from './src/i18n/fr';
import { FONT_FACES } from './src/theme/constants';
import { renderFontFaces } from './src/theme/utils';
import { getYearsOfExperience } from './src/utils/career';
import { APP_ICONS } from './src/utils/icons';
import {
  getNotFoundFiles,
  getOgImageUrl,
  getPageFiles,
  NOT_FOUND_FOLDER,
  PAGES,
} from './src/utils/pages';
import { renderSitemap, SITEMAP_FILE_NAME } from './src/utils/sitemap';
import { getWebManifestFiles, getWebManifestUrl, renderWebManifest } from './src/utils/webManifest';
import {
  ASSETS_DIR,
  HEADERS_FILE_NAME,
  PAGE_ENTRY_FILE,
  PAGES_DIR,
  SECURITY_HEADERS,
} from './vite/constants';
import { renderHeaderRules } from './vite/utils';

/** Longest time the production build may take in this test, coverage included. */
const BUILD_TIMEOUT_MS = 60_000;

/** URL of each `modulepreload` link of an HTML page. */
const MODULE_PRELOAD_HREF_PATTERN = /<link rel="modulepreload" crossorigin href="([^"]*)"/g;

/** Host of each URL that a file names with `//`, with or without its scheme. */
const URL_HOST_PATTERN = /\/\/([\w.-]+)/g;

/** Link tag of an HTML page, from `<link` to `>`, its attributes on one or several lines. */
const LINK_TAG_PATTERN = /<link\b[^>]*>/g;

/**
 * Name of a file of the assets folder: a name, then the 8 characters of the hash of its content
 * that Rollup writes for `[hash]`, then an extension.
 */
const HASHED_FILE_NAME_PATTERN = new RegExp(`^${ASSETS_DIR}/[^/]+-[\\w-]{8}\\.\\w+$`);

/** Module path of a page chunk: the index file of a folder of `src/pages`. */
const PAGE_ENTRY_PATTERN = new RegExp(`/${PAGES_DIR}/[^/]+/${PAGE_ENTRY_FILE}$`);

/** File of the build: a chunk of scripts or an asset, such as an HTML page. */
type OutputFile = Rollup.OutputChunk | Rollup.OutputAsset;

/** Files of the build, written in memory only. */
let output: OutputFile[] = [];

/** Output options of the build, as Rollup normalized them, with the templates of the file names. */
let outputOptions: Rollup.NormalizedOutputOptions | undefined;

/** Records the output options of the build, once Rollup has normalized them. */
const recordOutputOptions = (): Plugin => ({
  name: 'record-output-options',
  renderStart(options) {
    outputOptions = options;
  },
});

beforeAll(async () => {
  // Vitest sets NODE_ENV to test, which would bundle the development build of React
  vi.stubEnv('NODE_ENV', 'production');
  const result = await build({
    configFile: 'vite.config.ts',
    logLevel: 'silent',
    plugins: [recordOutputOptions()],
    build: { write: false },
  });
  output = (Array.isArray(result) ? result[0] : (result as Rollup.RollupOutput)).output;
}, BUILD_TIMEOUT_MS);

afterAll(() => {
  vi.unstubAllEnvs();
});

/** Tells whether a file of the build is a chunk of scripts. */
const isChunk = (file: OutputFile): file is Rollup.OutputChunk => file.type === 'chunk';

/** Tells whether a file of the build is an asset, such as an HTML page. */
const isAsset = (file: OutputFile): file is Rollup.OutputAsset => file.type === 'asset';

/** Reads a file of the build, such as an HTML page, or an empty string when the build has none. */
const getSource = (fileName: string) =>
  String(output.filter(isAsset).find(file => file.fileName === fileName)?.source ?? '');

/**
 * Reads the template that names a file of the build, such as `assets/[name]-[hash].js`: the one of
 * the assets, of the entry chunks or of the other chunks, written by a function or not.
 */
const getFileNameTemplate = (file: OutputFile) => {
  if (isAsset(file)) {
    const template = outputOptions?.assetFileNames;
    return typeof template === 'function' ? template(file) : template;
  }

  const template = file.isEntry ? outputOptions?.entryFileNames : outputOptions?.chunkFileNames;
  return typeof template === 'function' ? template(file) : template;
};

/** Lists the URLs of the scripts that an HTML page preloads. */
const getPreloadedUrls = (html: string) =>
  [...html.matchAll(MODULE_PRELOAD_HREF_PATTERN)].map(([, href]) => href);

/** URLs of the chunks built from a page folder. */
const getPageChunkUrls = () =>
  output
    .filter(isChunk)
    .filter(chunk => PAGE_ENTRY_PATTERN.test(chunk.facadeModuleId ?? ''))
    .map(chunk => `/${chunk.fileName}`);

/** URL of the chunk built from the index file of a page folder. */
const getPageChunkUrl = (folder: string) => {
  const entry = normalizePath(resolve(PAGES_DIR, folder, PAGE_ENTRY_FILE));
  const chunk = output.filter(isChunk).find(file => file.facadeModuleId === entry);
  return chunk && `/${chunk.fileName}`;
};

/** Lists the page chunks that an HTML page preloads. */
const getPreloadedPageChunks = (html: string) => {
  const pageChunkUrls = getPageChunkUrls();
  return getPreloadedUrls(html).filter(href => pageChunkUrls.includes(href));
};

/** Lists the hosts of Google that a file of the build names in a URL. */
const findGoogleHosts = (code: string) =>
  [...code.matchAll(URL_HOST_PATTERN)].map(([, host]) => host).filter(isGoogleHost);

/** Parameters of {@link getPreloads}. */
interface GetPreloadsParams {
  /** HTML of a page, or a part of it such as its head. */
  html: string;
  /** Kind of file that the links preload, their `as` attribute, e.g. `font`. */
  as: string;
}

/** Lists the link tags of an HTML page that preload a kind of file, each on one line. */
const getPreloads = ({ html, as }: GetPreloadsParams) =>
  (html.match(LINK_TAG_PATTERN) ?? [])
    .map(tag => tag.replace(/\s+/g, ' '))
    .filter(tag => tag.includes('rel="preload"') && tag.includes(`as="${as}"`));

/** Lists the link tags of an HTML page that preload a font, each on one line. */
const getFontPreloads = (html: string) => getPreloads({ html, as: 'font' });

/** Parameters of {@link getLinks}. */
interface GetLinksParams {
  /** HTML of a page, or a part of it such as its head. */
  html: string;
  /** Relation of the links, their `rel` attribute, e.g. `icon`. */
  rel: string;
}

/** Lists the link tags of an HTML page of a relation, each on one line. */
const getLinks = ({ html, rel }: GetLinksParams) =>
  (html.match(LINK_TAG_PATTERN) ?? [])
    .map(tag => tag.replace(/\s+/g, ' '))
    .filter(tag => tag.includes(` rel="${rel}"`));

/** Lists the URL of each link of an HTML page of a relation. */
const getLinkUrls = (params: GetLinksParams) =>
  getLinks(params).map(tag => tag.match(/\shref="([^"]*)"/)?.[1]);

/** Translations of each language, to read the titles the pages must have. */
const TRANSLATIONS = { fr, en };

/** Reads the language of an HTML page, in its `<html lang>`. */
const getHtmlLanguage = (html: string) => html.match(/<html lang="([^"]*)">/)?.[1];

/** Reads the title of an HTML page. */
const getTitle = (html: string) => html.match(/<title>([^<]*)<\/title>/)?.[1];

/** Reads the URL of the link preview image of an HTML page, in its `og:image`. */
const getOgImage = (html: string) => html.match(/property="og:image"\s+content="([^"]*)"/)?.[1];

/** Canonical link of an HTML page, on any number of lines. Its first group captures the URL. */
const CANONICAL_URL_PATTERN = /<link\s+rel="canonical"\s+href="([^"]*)"/;

/**
 * Link to a translation, in the head of an HTML page or in a `url` of the sitemap (`xhtml:link`).
 * Its groups capture the `hreflang` and the URL.
 */
const ALTERNATE_LINK_PATTERN =
  /<(?:xhtml:)?link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g;

/** `url` element of the sitemap, from its opening to its closing tag. */
const SITEMAP_URL_PATTERN = /<url>[\s\S]*?<\/url>/g;

/** Location of a `url` of the sitemap. Its first group captures the URL. */
const SITEMAP_LOCATION_PATTERN = /<loc>([^<]*)<\/loc>/g;

/** Reads the canonical URL of an HTML page. */
const getCanonicalUrl = (html: string) => html.match(CANONICAL_URL_PATTERN)?.[1];

/** Lists the `hreflang` and the URL of each link to a translation, of a page or a sitemap URL. */
const getAlternateLinks = (markup: string) =>
  [...markup.matchAll(ALTERNATE_LINK_PATTERN)].map(([, hreflang, href]) => [hreflang, href]);

/** Lists the locations of the URLs of the sitemap, in its order. */
const getSitemapLocations = (sitemap: string) =>
  [...sitemap.matchAll(SITEMAP_LOCATION_PATTERN)].map(([, location]) => location);

/** Parameters of {@link getSitemapUrlEntry}. */
interface GetSitemapUrlEntryParams {
  /** XML of the sitemap. */
  sitemap: string;
  /** Location of the URL to find, e.g. `https://issoufi.fr/en/projects`. */
  location: string;
}

/** Finds the `url` element of the sitemap for a location, or an empty string without one. */
const getSitemapUrlEntry = ({ sitemap, location }: GetSitemapUrlEntryParams) =>
  sitemap.match(SITEMAP_URL_PATTERN)?.find(url => url.includes(`<loc>${location}</loc>`)) ?? '';

/** Script tag of an HTML page, from `<script` to `>`, its attributes on one or several lines. */
const SCRIPT_TAG_PATTERN = /<script\b[^>]*>/g;

/** `src` attribute of a tag, naming a file. */
const SOURCE_ATTRIBUTE_PATTERN = /\ssrc="[^"]+"/;

/** Tells whether a script tag runs inline code, having no file to run. */
const isInlineScriptTag = (tag: string) => !SOURCE_ATTRIBUTE_PATTERN.test(tag);

/** Lists the script tags of an HTML page that run inline code. */
const getInlineScriptTags = (html: string) =>
  (html.match(SCRIPT_TAG_PATTERN) ?? []).filter(isInlineScriptTag);

/** Content Security Policy line of `_headers`. Its first group captures the policy. */
const CONTENT_SECURITY_POLICY_LINE_PATTERN = /^ {2}Content-Security-Policy: (.*)$/m;

/** Reads the sources of each directive of the Content Security Policy that `_headers` sends. */
const getPolicyDirectives = (headersFile: string) => {
  const policy = headersFile.match(CONTENT_SECURITY_POLICY_LINE_PATTERN)?.[1] ?? '';
  return Object.fromEntries(
    policy.split(';').map(directive => {
      const [name, ...sources] = directive.trim().split(/\s+/);
      return [name, sources];
    }),
  );
};

describe('pages generated by the build', () => {
  const [homePage] = PAGES;
  const pageFiles = getPageFiles();
  const notFoundFiles = getNotFoundFiles();
  const homePages = pageFiles.filter(({ page }) => page === homePage);
  const generatedPages = [
    ...pageFiles
      .filter(({ page }) => page !== homePage)
      .map(({ fileName, page }) => ({ fileName, folder: page.folder })),
    ...notFoundFiles.map(({ fileName }) => ({ fileName, folder: NOT_FOUND_FOLDER })),
  ];

  it('builds one chunk per page loaded lazily, shared by its languages', () => {
    const lazyFolders = new Set(generatedPages.map(({ folder }) => folder));

    expect(getPageChunkUrls()).toHaveLength(lazyFolders.size);
  });

  it.each(pageFiles.map(({ fileName, page, language }) => ({ fileName, page, language })))(
    'writes $fileName in $language, with its title',
    ({ fileName, page, language }) => {
      const html = getSource(fileName);

      expect(getHtmlLanguage(html)).toBe(language);
      expect(getTitle(html)).toBe(TRANSLATIONS[language].meta[page.meta].title);
      expect(getOgImage(html)).toBe(getOgImageUrl(language));
    },
  );

  it.each(notFoundFiles)(
    'writes the not found page $fileName in $language',
    ({ fileName, language }) => {
      const html = getSource(fileName);

      expect(getHtmlLanguage(html)).toBe(language);
      expect(getTitle(html)).toBe(TRANSLATIONS[language].meta.notFound.title);
      expect(html).toContain('<meta name="robots" content="noindex" />');
    },
  );

  it.each(generatedPages)(
    '$fileName preloads the chunk of $folder, and no other page chunk',
    ({ fileName, folder }) => {
      const pageChunkUrl = getPageChunkUrl(folder);

      expect(pageChunkUrl).toMatch(new RegExp(`^/${ASSETS_DIR}/${folder}-[\\w-]+\\.js$`));
      expect(getPreloadedPageChunks(getSource(fileName))).toEqual([pageChunkUrl]);
    },
  );

  it.each(generatedPages)('$fileName preloads its chunk in its head', ({ fileName, folder }) => {
    const html = getSource(fileName);
    const linkPosition = html.indexOf(`href="${getPageChunkUrl(folder)}"`);

    expect(linkPosition).toBeGreaterThan(html.indexOf('<head>'));
    expect(linkPosition).toBeLessThan(html.indexOf('</head>'));
  });

  describe.each(
    [...pageFiles, ...notFoundFiles].map(({ fileName, language }) => ({ fileName, language })),
  )('$fileName', ({ fileName, language }) => {
    const getHead = () => {
      const html = getSource(fileName);
      return html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
    };

    it('preloads each web font of the site, from the site, in its head', () => {
      expect(getFontPreloads(getHead())).toEqual(
        FONT_FACES.map(
          ({ url }) => `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin>`,
        ),
      );
    });

    it('preloads no image, whose bytes would delay the scripts and fonts of the text', () => {
      expect(getPreloads({ html: getSource(fileName), as: 'image' })).toEqual([]);
    });

    it('declares the web fonts in a style of its head, which no component changes', () => {
      expect(getHead()).toContain(`<style>${renderFontFaces()}</style>`);
    });

    it('runs no inline script, which its Content Security Policy would block', () => {
      expect(getSource(fileName)).toMatch(SCRIPT_TAG_PATTERN);
      expect(getInlineScriptTags(getSource(fileName))).toEqual([]);
    });

    it('links the SVG favicon, after the ICO one of the older browsers, in its head', () => {
      const { url, sizePx } = APP_ICONS.legacyFavicon;
      expect(getLinks({ html: getHead(), rel: 'icon' })).toEqual([
        `<link rel="icon" href="${url}" sizes="${sizePx}x${sizePx}" />`,
        `<link rel="icon" href="${APP_ICONS.favicon.url}" type="${APP_ICONS.favicon.type}" />`,
      ]);
    });

    it('links the Apple touch icon, which iOS puts on its home screen, in its head', () => {
      expect(getLinkUrls({ html: getHead(), rel: 'apple-touch-icon' })).toEqual([
        APP_ICONS.appleTouch.url,
      ]);
    });

    it(`links the web app manifest of ${language} only, in its head`, () => {
      expect(getLinkUrls({ html: getSource(fileName), rel: 'manifest' })).toEqual([
        getWebManifestUrl(language),
      ]);
      expect(getLinkUrls({ html: getHead(), rel: 'manifest' })).toHaveLength(1);
    });
  });

  it('names no host of Google in a page or a script', () => {
    const files = output.map(file => ({
      fileName: file.fileName,
      code: isChunk(file) ? file.code : String(file.source),
    }));

    expect(files.length).toBeGreaterThan(0);
    files.forEach(({ fileName, code }) => expect(findGoogleHosts(code), fileName).toEqual([]));
  });

  it.each(homePages)(
    'preloads no page chunk in the home page $fileName, which is in the main chunk',
    ({ fileName }) => {
      const html = getSource(fileName);

      expect(html).toContain('<script type="module"');
      expect(getPreloadedPageChunks(html)).toEqual([]);
    },
  );
});

describe('sitemap generated by the build', () => {
  const pageFiles = getPageFiles();

  it(`writes ${SITEMAP_FILE_NAME} at the root of the build`, () => {
    expect(getSource(SITEMAP_FILE_NAME)).toBe(renderSitemap());
  });

  it('lists the canonical URL of every page of the build, in every language', () => {
    const canonicalUrls = pageFiles.map(({ fileName }) => getCanonicalUrl(getSource(fileName)));

    expect(canonicalUrls).not.toContain(undefined);
    expect(getSitemapLocations(getSource(SITEMAP_FILE_NAME))).toEqual(canonicalUrls);
  });

  it.each(pageFiles)(
    'links $fileName to the same translations as its HTML file',
    ({ fileName }) => {
      const html = getSource(fileName);
      const sitemapUrl = getSitemapUrlEntry({
        sitemap: getSource(SITEMAP_FILE_NAME),
        location: getCanonicalUrl(html) ?? '',
      });

      expect(getAlternateLinks(html)).toHaveLength(LANGUAGES.length + 1);
      expect(getAlternateLinks(sitemapUrl)).toEqual(getAlternateLinks(html));
    },
  );
});

describe('web app manifests generated by the build', () => {
  it.each(getWebManifestFiles())('writes $fileName in $language', ({ language, fileName }) => {
    expect(getSource(fileName)).toBe(
      renderWebManifest({ language, years: getYearsOfExperience() }),
    );
  });

  it.each(getWebManifestFiles())(
    'lists in $fileName icons that the site serves',
    ({ fileName }) => {
      const { icons } = JSON.parse(getSource(fileName));

      expect(icons.length).toBeGreaterThan(0);
      icons.forEach(({ src }: { src: string }) => {
        expect(existsSync(resolve('public', src.replace(/^\//, ''))), src).toBe(true);
      });
    },
  );

  it('leaves out the former manifest, which named the French site on every page', () => {
    expect(existsSync(resolve('public', 'manifest.json'))).toBe(false);
  });
});

describe('HTTP headers generated by the build', () => {
  it(`writes ${HEADERS_FILE_NAME} at the root of the build`, () => {
    expect(getSource(HEADERS_FILE_NAME)).toBe(renderHeaderRules());
  });

  it('gives every file of the site the security headers', () => {
    const securityLines = Object.entries(SECURITY_HEADERS).map(
      ([name, value]) => `  ${name}: ${value}\n`,
    );

    expect(getSource(HEADERS_FILE_NAME)).toContain(`/*\n${securityLines.join('')}`);
  });

  it('lets a page load files from the site only, and run no inline script nor eval', () => {
    const directives = getPolicyDirectives(getSource(HEADERS_FILE_NAME));

    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['script-src']).toEqual(["'self'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['base-uri']).toEqual(["'self'"]);
  });

  it('lets no other site show a page in a frame', () => {
    expect(getPolicyDirectives(getSource(HEADERS_FILE_NAME))['frame-ancestors']).toEqual([
      "'none'",
    ]);
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('DENY');
  });

  it('serves the same security headers from vite preview, as the browser tests run', async () => {
    const config = await resolveConfig(
      { configFile: 'vite.config.ts', logLevel: 'silent' },
      'serve',
      'production',
    );

    expect(config.preview.headers).toEqual(SECURITY_HEADERS);
  });

  it(`caches the files of ${ASSETS_DIR}/ for a year, as immutable`, () => {
    expect(getSource(HEADERS_FILE_NAME)).toContain(
      `/${ASSETS_DIR}/*\n  Cache-Control: public, max-age=31536000, immutable\n`,
    );
  });

  it(`names every file of ${ASSETS_DIR}/ after a hash of its content, so it can stay a year`, () => {
    const assetsDirFiles = output.filter(file => file.fileName.startsWith(`${ASSETS_DIR}/`));

    expect(assetsDirFiles.length).toBeGreaterThan(0);
    assetsDirFiles.forEach(file => {
      expect(getFileNameTemplate(file), file.fileName).toContain('[hash]');
      expect(file.fileName).toMatch(HASHED_FILE_NAME_PATTERN);
    });
  });

  it(`copies no file of public/ into ${ASSETS_DIR}/, where it would stay a year under its name`, () => {
    expect(existsSync(resolve('public', ASSETS_DIR))).toBe(false);
  });
});
