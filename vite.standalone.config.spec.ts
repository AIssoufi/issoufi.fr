// @vitest-environment jsdom
import { execFileSync } from 'node:child_process';
import { basename, extname, resolve } from 'node:path';
import { build, normalizePath, type Plugin, type Rolldown } from 'vite';

import { isGoogleHost } from './e2e/utils.ts';
import { FONT_FACES } from './src/theme/constants.ts';
import { HOME_PAGE } from './src/utils/pages.ts';
import { APP_CONTAINER_ID } from './src/utils/prerender.ts';
import { SITEMAP_FILE_NAME } from './src/utils/sitemap.ts';
import { renderStructuredDataScript } from './src/utils/structuredData.ts';
import { ASSETS_DIR, HEADERS_FILE_NAME, ROBOTS_FILE_NAME } from './vite/constants.ts';
import {
  HASH_ROUTER_MODULE,
  OPTIONAL_ESCAPE_PATTERN,
  QUOTE_PATTERN,
  STANDALONE_PAGE_FILE_NAME,
  STANDALONE_README_FILE_NAME,
} from './vite/standalone/constants.ts';
import { isServerOnlyFile } from './vite/standalone/utils/bundle.ts';
import { readFontDataUrl } from './vite/standalone/utils/fonts.ts';
import { listFileNames, listStandalonePublicFiles } from './vite/standalone/utils/public-files.ts';
import { escapeRegExp } from './vite/utils/strings.ts';

/** Longest time the standalone build may take in this test, coverage included. */
const BUILD_TIMEOUT_MS = 60_000;

/**
 * How Vite loads the config in this test: bundled by Rolldown, not imported by Node.js as the
 * scripts of `package.json` do, which would merge a second copy of the modules of `vite/` into the
 * coverage and give their branches wrong counts (see `CONFIG_LOADER` in `vite.config.spec.ts`).
 * Only the release workflow builds the standalone page, so a test imports the config with Node.js
 * in a process of its own, out of the coverage (see {@link STANDALONE_CONFIG_IMPORT}).
 */
const CONFIG_LOADER = 'bundle';

/**
 * Script that imports the standalone config as `pnpm build:standalone` does, with Node.js, which
 * fails on an import that it cannot resolve, such as one without the extension of its file.
 */
const STANDALONE_CONFIG_IMPORT = "await import('./vite.standalone.config.ts');";

/** Module of the app that renders the router. */
const APP_MODULE = normalizePath(resolve('src/App/App.tsx'));

/** Host of each URL that the page names with `//`, with or without its scheme. */
const URL_HOST_PATTERN = /\/\/([\w.-]+)/g;

/** Slash that starts an absolute URL, e.g. of a font file of `public/`. */
const LEADING_SLASH_PATTERN = /^\//;

/** A link that preloads a font file. */
const FONT_PRELOAD_SELECTOR = 'link[rel="preload"][as="font"]';

/** A script element that loads a file, or a link that preloads one. */
const EXTERNAL_SCRIPT_SELECTOR = 'script[src], link[rel="modulepreload"]';

/** Parameters of {@link hasQuotedUrl}. */
interface HasQuotedUrlParams {
  /** HTML of a page of the build. */
  html: string;
  /** URL of a file of `public/`, absolute or relative, e.g. `/home.webp` or `./home.webp`. */
  url: string;
}

/**
 * Tells whether a page names a URL as a whole string, between any quotes, escaped or not, as
 * `toRelativePublicUrls` finds them: the HTML writes its attributes between double quotes, and the
 * minifier the strings of the code between back quotes.
 */
const hasQuotedUrl = ({ html, url }: HasQuotedUrlParams) => {
  const escapedUrl = escapeRegExp(url);
  const pattern = `${QUOTE_PATTERN}${escapedUrl}${OPTIONAL_ESCAPE_PATTERN}${QUOTE_PATTERN}`;
  return new RegExp(pattern).test(html);
};

/** File of the build: a chunk of scripts or an asset, such as an HTML page. */
type OutputFile = Rolldown.OutputChunk | Rolldown.OutputAsset;

/** Files of the build, written in memory only. */
let output: OutputFile[] = [];

/** Modules that the module of the app imports, as the build resolved them. */
let appImports: readonly string[] = [];

/** Whether Vite copies the whole of `public/` into the build, as the resolved config says. */
let copiesPublicDir: boolean | undefined;

/**
 * Records the modules that {@link APP_MODULE} imports, once the build has resolved them, and
 * {@link copiesPublicDir}.
 */
const recordBuild = (): Plugin => ({
  name: 'record-build',
  configResolved: config => {
    copiesPublicDir = config.build.copyPublicDir;
  },
  buildEnd() {
    appImports = this.getModuleInfo(APP_MODULE)?.importedIds ?? [];
  },
});

beforeAll(async () => {
  // Vitest sets NODE_ENV to test, which would bundle the development build of React
  vi.stubEnv('NODE_ENV', 'production');
  const result = await build({
    configFile: 'vite.standalone.config.ts',
    configLoader: CONFIG_LOADER,
    logLevel: 'silent',
    plugins: [recordBuild()],
    build: { write: false },
  });
  output = (Array.isArray(result) ? result[0] : (result as Rolldown.RolldownOutput)).output;
}, BUILD_TIMEOUT_MS);

afterAll(() => {
  vi.unstubAllEnvs();
});

/** Tells whether a file of the build is an asset, such as an HTML page. */
const isAsset = (file: OutputFile): file is Rolldown.OutputAsset => file.type === 'asset';

/** Reads an asset of the build, or an empty string when the build has no such asset. */
const getSource = (fileName: string) =>
  String(output.filter(isAsset).find(file => file.fileName === fileName)?.source ?? '');

/**
 * Parses the page of the build as a browser does, an empty document when the build has none. The
 * parser reads the code of an inline script as text, so a tag written in a string of the code is
 * no element of the page.
 */
const readPage = () =>
  new DOMParser().parseFromString(getSource(STANDALONE_PAGE_FILE_NAME), 'text/html');

/** Tells whether a script element holds code, rather than loading a file or nothing. */
const hasCode = ({ textContent }: Element) => textContent.trim() !== '';

describe('standalone build', () => {
  it('has a config that Node.js loads, as `pnpm build:standalone` does', () => {
    const importConfig = () =>
      execFileSync(process.execPath, ['--input-type=module', '--eval', STANDALONE_CONFIG_IMPORT], {
        stdio: 'pipe',
      });

    expect(importConfig).not.toThrow();
  });

  it('has index.html as its only page', () => {
    const pages = output.map(file => file.fileName).filter(fileName => fileName.endsWith('.html'));

    expect(pages).toEqual([STANDALONE_PAGE_FILE_NAME]);
  });

  it('inlines the whole app in the page, so it loads no script from a file', () => {
    const html = getSource(STANDALONE_PAGE_FILE_NAME);

    expect(
      output.map(file => file.fileName).filter(fileName => /\.(js|css)$/.test(fileName)),
    ).toEqual([]);
    expect([...readPage().querySelectorAll('script[type="module"]')].some(hasCode)).toBe(true);
    // A marker left by Vite would make each lazy page throw when it loads
    expect(html).not.toContain('__VITE_PRELOAD__');
    expect(readPage().querySelector(EXTERNAL_SCRIPT_SELECTOR)).toBeNull();
  });

  it('fills the metadata of the home page', () => {
    const html = getSource(STANDALONE_PAGE_FILE_NAME);

    expect(html).not.toContain('%PAGE_');
    expect(readPage().querySelector('title')?.textContent).toMatch(/./);
  });

  it('keeps the structured data of the home page, apart from the script of the app', () => {
    expect(getSource(STANDALONE_PAGE_FILE_NAME)).toContain(
      renderStructuredDataScript({ page: HOME_PAGE }),
    );
  });

  it('leaves the container of the app empty, for the app to render at the hash of the URL', () => {
    const page = readPage();

    expect(page.getElementById(APP_CONTAINER_ID)?.outerHTML).toBe(
      `<div id="${APP_CONTAINER_ID}"></div>`,
    );
    expect(page.querySelector('style[data-styled]')).toBeNull();
  });

  it('routes the app on the hash of the URL', () => {
    const hashRouterModule = normalizePath(resolve(HASH_ROUTER_MODULE));

    expect(appImports).toContain(hashRouterModule);
  });

  it('refers to the files of public/ with URLs relative to the page', () => {
    const html = getSource(STANDALONE_PAGE_FILE_NAME);
    const fileNames = listFileNames(resolve('public'));
    const absoluteUrls = fileNames.filter(fileName => hasQuotedUrl({ html, url: `/${fileName}` }));

    expect(fileNames.length).toBeGreaterThan(0);
    expect(absoluteUrls).toEqual([]);
    [
      'home.webp',
      'home-portrait.webp',
      'projects.webp',
      'projects-portrait.webp',
      'experiences.webp',
      'experiences-portrait.webp',
      'favicon.ico',
      'favicon.svg',
      'apple-touch-icon.png',
    ].forEach(name => {
      expect(hasQuotedUrl({ html, url: `./${name}` }), name).toBe(true);
    });
  });

  it('embeds the web fonts of the site in the page, as data URLs', () => {
    const html = getSource(STANDALONE_PAGE_FILE_NAME);

    FONT_FACES.forEach(({ url }) => {
      const dataUrl = readFontDataUrl({ publicDir: resolve('public'), url });

      expect(dataUrl).toMatch(/^data:font\/woff2;base64,./);
      expect(html).toContain(dataUrl);
      expect(html).not.toContain(url);
    });
  });

  it('preloads no font, since the page holds them', () => {
    expect(readPage().querySelector(FONT_PRELOAD_SELECTOR)).toBeNull();
  });

  it(`copies no web font into ${ASSETS_DIR}/, unlike the production build, since the page holds them`, () => {
    const fontNames = FONT_FACES.map(({ url }) => basename(url, extname(url)));
    const isFontCopy = (fileName: string) =>
      fontNames.some(name => fileName.startsWith(`${ASSETS_DIR}/${name}-`));

    expect(fontNames.length).toBeGreaterThan(0);
    expect(output.map(file => file.fileName).filter(isFontCopy)).toEqual([]);
  });

  it('names no host of Google, so it renders the same offline', () => {
    const html = getSource(STANDALONE_PAGE_FILE_NAME);
    const hosts = [...html.matchAll(URL_HOST_PATTERN)].map(([, host]) => host);

    expect(hosts.length).toBeGreaterThan(0);
    expect(hosts.filter(isGoogleHost)).toEqual([]);
  });

  it('leaves out the web app manifests and the link to them, since no browser installs it', () => {
    expect(output.map(file => file.fileName).filter(name => name.endsWith('.webmanifest'))).toEqual(
      [],
    );
    expect(readPage().querySelector('[rel="manifest"]')).toBeNull();
  });

  it(`leaves out the ${HEADERS_FILE_NAME} of Cloudflare Pages, which no server reads from the disk`, () => {
    expect(output.map(file => file.fileName)).not.toContain(HEADERS_FILE_NAME);
  });

  it(`leaves out ${SITEMAP_FILE_NAME}, which no search engine reads from the disk`, () => {
    expect(output.map(file => file.fileName)).not.toContain(SITEMAP_FILE_NAME);
  });

  it(`leaves out ${ROBOTS_FILE_NAME}, which no crawler reads from the disk`, () => {
    expect(listFileNames(resolve('public'))).toContain(ROBOTS_FILE_NAME);
    expect(output.map(file => file.fileName)).not.toContain(ROBOTS_FILE_NAME);
  });

  it('holds no file that only a web server or a crawler reads', () => {
    expect(output.map(file => file.fileName).filter(isServerOnlyFile)).toEqual([]);
  });

  it('copies the files of public/ itself, since Vite would copy its server files too', () => {
    const fileNames = output.map(file => file.fileName);
    const publicFiles = listStandalonePublicFiles(resolve('public'));
    const fontFiles = FONT_FACES.map(({ url }) => url.replace(LEADING_SLASH_PATTERN, ''));

    // Vite's copy of public/ never shows in this output, written in memory only
    expect(copiesPublicDir).toBe(false);
    expect(publicFiles).toEqual(expect.arrayContaining(['home.webp', ...fontFiles]));
    expect(fileNames).toEqual(expect.arrayContaining(publicFiles));
  });

  it('tells how to open it in a README.txt', () => {
    expect(getSource(STANDALONE_README_FILE_NAME)).toContain('index.html');
  });
});
