import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import svgr from 'vite-plugin-svgr';

import packageJson from './package.json' with { type: 'json' };
import { DEFAULT_LANGUAGE } from './src/i18n/constants.ts';
import { FONT_FACES } from './src/theme/constants.ts';
import { getYearsOfExperience } from './src/utils/career.ts';
import {
  addModulePreload,
  addPrerenderedPage,
  renderNotFoundHtml,
  renderPageHtml,
} from './src/utils/pageHtml.ts';
import {
  getNotFoundFiles,
  getPageFiles,
  HOME_PAGE,
  isTemplatePageFile,
  NOT_FOUND_FOLDER,
  STATUS_PAGE_BACKGROUND_PHOTO,
} from './src/utils/pages.ts';
import { renderSitemap, SITEMAP_FILE_NAME } from './src/utils/sitemap.ts';
import {
  findWebManifestLanguage,
  getWebManifestFiles,
  renderWebManifest,
  WEB_MANIFEST_MEDIA_TYPE,
} from './src/utils/webManifest.ts';
import {
  ALL_ENV_VARIABLES_PREFIX,
  ASSETS_DIR,
  BUILD_TARGET,
  CODE_SPLITTING_GROUPS,
  FONT_FACES_PLUGIN_NAME,
  HEADERS_FILE_NAME,
  PAGE_META_PLUGIN_NAME,
  SECURITY_HEADERS,
} from './vite/constants.ts';
import { notFoundPages } from './vite/preview/plugins.ts';
import { minifyStyledCss, styledComponentIds } from './vite/prerender/plugins.ts';
import { prerenderPagesInWorker } from './vite/prerender/utils/render.ts';
import type { FontFacesApi, PageMetaApi } from './vite/types.ts';
import {
  getAssetFileName,
  getChunkName,
  getFontFaceTags,
  getPageChunkFiles,
  getServerPorts,
  renderHeaderRules,
} from './vite/utils.ts';

/**
 * Vite plugin that adds the web fonts of the site to the head of `index.html`, in development as
 * in the build: a link that preloads each font file, then a `<style>` of their `@font-face` rules
 * (see {@link getFontFaceTags}). The build copies each font file of `public/` into
 * {@link ASSETS_DIR} under a hash of its content, which the pages load, so that browsers keep it a
 * year without asking the server again (see `HEADER_RULES`), and fails when a file is missing. The
 * dev server serves the files of `public/`, as the standalone build does, which embeds them (see
 * {@link FontFacesApi}). It runs before {@link pageMeta}, which emits every other page from the
 * same head.
 */
const fontFaces = (): Plugin<FontFacesApi> => {
  let publicDir = '';
  let base = '';
  let isBuild = false;
  let keepsPublicUrls = false;

  const getFontFile = (url: string) => join(publicDir, url);
  const isHashingFonts = () => isBuild && !keepsPublicUrls;

  return {
    name: FONT_FACES_PLUGIN_NAME,
    api: {
      keepPublicUrls: () => {
        keepsPublicUrls = true;
      },
    },
    configResolved: config => {
      publicDir = config.publicDir;
      base = config.base;
      isBuild = config.command === 'build';
    },
    buildStart() {
      if (!isHashingFonts()) return;

      FONT_FACES.forEach(({ url }) => {
        const fontFile = getFontFile(url);
        this.emitFile({
          type: 'asset',
          name: basename(url),
          originalFileName: fontFile,
          source: readFileSync(fontFile),
        });
      });
    },
    transformIndexHtml(_html, { bundle }) {
      if (!isHashingFonts()) return getFontFaceTags();

      const getUrl = (url: string) => {
        const fileName = getAssetFileName({ bundle, originalFileName: getFontFile(url) });
        if (!fileName) this.error(`The build has no copy of the font file ${url}`);
        return `${base}${fileName}`;
      };
      return getFontFaceTags({ getUrl });
    },
  };
};

/** Date of the build, whose month the durations of the pages that it renders count to. */
const BUILD_DATE = new Date();

/**
 * Constants that the build writes into the code of the app, by name, typed in src/vite-env.d.ts:
 * the version that release-please writes in package.json, shown after the logo of the header
 * (src/App/Header), and the month of the build, the today of the pages that it renders, which the
 * browser keeps while it hydrates them (src/pages/Experiences/JobSummary). Only a month, so that
 * the chunk of the page that reads it keeps its hash across the builds of a month. The tests and
 * the pages rendered at build time read them too.
 */
const BUILD_CONSTANTS = {
  __APP_VERSION__: JSON.stringify(packageJson.version),
  __BUILD_MONTH__: JSON.stringify({
    year: BUILD_DATE.getFullYear(),
    monthIndex: BUILD_DATE.getMonth(),
  }),
};

/** Parameters of the `preloadPageChunks` helper of {@link pageMeta}. */
interface PreloadPageChunksParams {
  /** HTML of a generated page. */
  html: string;
  /** Folder in `src/pages` of the page that the HTML shows. */
  folder: string;
}

/**
 * Vite plugin that fills the metadata of `index.html` for the home page of the default language,
 * then emits from the same template the HTML file of every other page in every language
 * (`projects.html`, `en/index.html`, `en/projects.html`…) and a not found page per language
 * (`404.html`, `en/404.html`). It runs after Vite's own HTML plugin (`enforce: 'post'`), so the
 * template already contains the hashed asset tags. Each emitted page also preloads the chunk of
 * the page it shows, and the chunks that this one imports, so a direct visit downloads them at the
 * same time as the main chunk; the home page is in the main chunk and needs none.
 *
 * Each file also holds the app rendered at the path of its page, with its styles (see
 * {@link prerenderPagesInWorker}), which the browser shows before any script runs, and without
 * JavaScript, then hydrates (see `canHydrate`). Since its first paint needs no script, it loads
 * the scripts and its background photo at a low priority (see {@link addPrerenderedPage}). A not
 * found page holds the app rendered at a path of no page, which the browser renders again at the
 * path that the visitor typed, over the photo of the status pages. Its API skips that render, for
 * the standalone build (see {@link PageMetaApi}).
 */
const pageMeta = (): Plugin<PageMetaApi> => {
  let template = '';
  let base = '/';
  let root = '';
  let isPrerendering = true;

  return {
    name: PAGE_META_PLUGIN_NAME,
    enforce: 'post',
    api: {
      skipPrerender: () => {
        isPrerendering = false;
      },
    },
    configResolved: config => {
      base = config.base;
      root = config.root;
    },
    transformIndexHtml: html => {
      template = html;
      return renderPageHtml({
        template: html,
        page: HOME_PAGE,
        language: DEFAULT_LANGUAGE,
        years: getYearsOfExperience(),
      });
    },
    async generateBundle(_options, bundle) {
      if (!template) this.error('index.html was not transformed before generateBundle');

      /**
       * Preloads in a generated page the chunk of the page in `folder`, when it has one, and the
       * chunks that it imports statically.
       */
      const preloadPageChunks = ({ html, folder }: PreloadPageChunksParams) =>
        getPageChunkFiles({ bundle, folder }).reduce(
          (page, chunkFile) => addModulePreload({ html: page, href: `${base}${chunkFile}` }),
          html,
        );

      const years = getYearsOfExperience();
      const pageFiles = getPageFiles();
      const notFoundFiles = getNotFoundFiles();
      const renderedPages = isPrerendering
        ? await prerenderPagesInWorker({
            root,
            define: BUILD_CONSTANTS,
            paths: [...pageFiles, ...notFoundFiles].map(({ path }) => path),
          })
        : new Map();

      pageFiles.forEach(file => {
        const { page, language, fileName, path } = file;
        const renderedPage = renderedPages.get(path);
        if (isTemplatePageFile(file)) {
          // Vite writes the home page of the default language from the template itself
          const templateFile = bundle[fileName];
          const hasTemplateFile = templateFile?.type === 'asset';
          if (!hasTemplateFile) this.error(`The build has no ${fileName}`);

          templateFile.source = addPrerenderedPage({
            html: String(templateFile.source),
            page: renderedPage,
            hydrationPath: path,
            backgroundPhoto: page.backgroundPhoto,
          });
          return;
        }

        const html = renderPageHtml({ template, page, language, years });
        this.emitFile({
          type: 'asset',
          fileName,
          // The chunks first, whose preloads the rendered page lowers with the other scripts
          source: addPrerenderedPage({
            html: preloadPageChunks({ html, folder: page.folder }),
            page: renderedPage,
            hydrationPath: path,
            backgroundPhoto: page.backgroundPhoto,
          }),
        });
      });

      notFoundFiles.forEach(({ language, fileName, path }) => {
        const html = renderNotFoundHtml({ template, language, years });
        this.emitFile({
          type: 'asset',
          fileName,
          source: addPrerenderedPage({
            html: preloadPageChunks({ html, folder: NOT_FOUND_FOLDER }),
            page: renderedPages.get(path),
            backgroundPhoto: STATUS_PAGE_BACKGROUND_PHOTO,
          }),
        });
      });
    },
  };
};

/**
 * Vite plugin that emits `sitemap.xml` at the root of the build: the URL of every page in every
 * language, with the links to its translations (see {@link renderSitemap}). `public/robots.txt`
 * points search engines to it.
 */
const sitemap = (): Plugin => ({
  name: 'sitemap',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: SITEMAP_FILE_NAME, source: renderSitemap() });
  },
});

/**
 * Vite plugin that emits the web app manifest of each language, `manifest.webmanifest` at the root
 * of the build and `en/manifest.webmanifest` (see {@link renderWebManifest}), which the pages of
 * that language link, and that the dev server sends at the same URLs.
 */
const webManifests = (): Plugin => ({
  name: 'web-manifests',
  configureServer: server => {
    server.middlewares.use((request, response, next) => {
      const language = findWebManifestLanguage(request.url);
      if (!language) return next();

      response.setHeader('Content-Type', WEB_MANIFEST_MEDIA_TYPE);
      response.end(renderWebManifest({ language, years: getYearsOfExperience() }));
    });
  },
  generateBundle() {
    const years = getYearsOfExperience();
    getWebManifestFiles().forEach(({ language, fileName }) => {
      this.emitFile({ type: 'asset', fileName, source: renderWebManifest({ language, years }) });
    });
  },
});

/**
 * Vite plugin that emits `_headers` at the root of the build, the HTTP headers that Cloudflare
 * Pages adds to the files it serves, by path (see {@link renderHeaderRules}): the security headers
 * of every file, such as its Content Security Policy, `X-Robots-Tag: noindex` on the `pages.dev`
 * host of the project (`PAGES_PROJECT_HOST`), then the cache policy, under which browsers
 * keep the hashed files of `assets/` a year, and revalidate every other file, as Cloudflare Pages
 * does by default.
 */
const httpHeaders = (): Plugin => ({
  name: 'http-headers',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: HEADERS_FILE_NAME, source: renderHeaderRules() });
  },
});

/**
 * Minimum test coverage, in percent, below which `pnpm test:coverage` fails: 100% of the lines,
 * statements, branches and functions, Vite and CI helpers included, as Vitest 5 measures them since
 * October 2026, so the CI keeps every line of a new change tested. Code that a test cannot reach
 * is removed when the types allow it, or else covered by a test that fakes the case. Vitest maps
 * the V8 coverage onto the syntax tree and counts only the executable code, so its figures differ
 * from a major to the next for the same tests: Vitest 5 counts 11 statements fewer than Vitest 4.
 */
const COVERAGE_THRESHOLDS_PERCENT = { lines: 100, statements: 100, branches: 100, functions: 100 };

/**
 * Time a test may take before Vitest fails it, in milliseconds: twice its default of 5 s. Several
 * suites often share one machine, as when ticket workers test their worktrees at the same time,
 * and the heaviest renders then outlast the default, although they take under 1 s alone.
 */
const TEST_TIMEOUT_MS = 10_000;

/**
 * Vite and Vitest configuration: React with SVG components, the web fonts, page metadata, sitemap,
 * web app manifests and HTTP headers plugins, the build for the browsers of {@link BUILD_TARGET},
 * a chunk per lazy page and named chunks for the libraries and the shared modules (see
 * {@link CODE_SPLITTING_GROUPS}), the dev and preview servers on the port of the worktree (see
 * {@link getServerPorts}), which fail when it is taken, the preview server with the security
 * headers and the not found pages of the site, with their status 404, as Cloudflare Pages serves
 * them (see {@link notFoundPages}), and the tests in jsdom with coverage. Node.js loads it as it
 * is, its types stripped (`--configLoader native` in the scripts of `package.json`): every
 * relative import of the modules that it loads names its `.ts` file, and a JSON import says
 * `with { type: 'json' }`.
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
  const ports = getServerPorts(loadEnv(mode, process.cwd(), ALL_ENV_VARIABLES_PREFIX));

  return {
    base: '/',
    plugins: [
      react(),
      svgr(),
      // The build only: the dev server and the tests render in the browser alone
      { ...styledComponentIds(), apply: 'build' },
      { ...minifyStyledCss(), apply: 'build' },
      fontFaces(),
      pageMeta(),
      sitemap(),
      webManifests(),
      httpHeaders(),
      notFoundPages(),
    ],
    define: BUILD_CONSTANTS,
    build: {
      // The browsers of the app, whose syntax and APIs tsconfig.app.json checks it against
      target: BUILD_TARGET,
      rolldownOptions: {
        output: {
          // The chunk of each lazily loaded page is named after its folder, not its index file
          chunkFileNames: chunk => `${ASSETS_DIR}/${getChunkName(chunk)}-[hash].js`,
          // The libraries and the modules that the pages share get chunks named after them
          codeSplitting: { groups: CODE_SPLITTING_GROUPS },
        },
      },
    },
    // A taken port stops the server instead of moving it to the next free port, so a test never
    // reaches the server of another worktree by mistake
    server: {
      port: ports.dev,
      strictPort: true,
      // Vite does not open the browser when BROWSER=none, as for the ticket workers
      open: true,
    },
    preview: {
      port: ports.preview,
      strictPort: true,
      // The security headers of Cloudflare Pages, so the browser tests run under the same Content
      // Security Policy. The dev server sends none: its inline scripts reload the modules
      headers: SECURITY_HEADERS,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      testTimeout: TEST_TIMEOUT_MS,
      // Each spec keeps its own worker and jsdom, the defaults, set here so that Vitest prints no
      // hint to share them. With the vmThreads pool, each spec runs in a realm of its own, whose
      // values the native code of Rolldown and instanceof refuse: 58 tests fail. With
      // isolate: false, the specs see the state that the previous ones left: 33 files fail and the
      // run never ends
      pool: 'forks',
      isolate: true,
      // styled-components inserts each rule into the CSSOM, as in production, rather than adding
      // its text to a <style>, which jsdom parses again whole on every change: a quadratic cost
      // that made the tests several times slower since jsdom 29
      env: { SC_DISABLE_SPEEDY: 'false' },
      // Vite resolves styled-components to its browser build, as in the app, instead of Node.js
      // loading its server build, whose createGlobalStyle injects nothing in jsdom in 6.5. xstyled
      // goes through Vite too, so that the app and xstyled share one copy of styled-components
      alias: [
        {
          find: /^styled-components$/,
          replacement: 'styled-components/dist/styled-components.browser.esm.js',
        },
      ],
      server: { deps: { inline: ['styled-components', '@xstyled/styled-components'] } },
      coverage: {
        provider: 'v8',
        // The helpers of the scripts and of the browser tests are measured, not the scripts and the
        // Playwright tests that use them. The Worker of the deploy trigger is measured whole
        include: [
          'src/**/*.{ts,tsx}',
          'vite/**/*.ts',
          'e2e/**/*.ts',
          'scripts/utils/**/*.mjs',
          'scripts/ci/utils/**/*.mjs',
          'scripts/deploy-trigger/**/*.mjs',
          'scripts/og-image/utils/**/*.mjs',
          'scripts/icons/utils/**/*.mjs',
          'scripts/cv/utils/**/*.mjs',
          'scripts/commits/utils/**/*.mjs',
        ],
        exclude: [
          '**/*.spec.*',
          // The browser tests run in Playwright, not in Vitest
          '**/*.e2e.ts',
          '**/*.visual.ts',
          '**/index.ts',
          '**/*.d.ts',
          'src/setupTests.ts',
          // The entry point only mounts the app, which App.spec.jsx renders
          'src/index.tsx',
          // A thread apart from the coverage, which the specs of vite/prerender start
          'vite/prerender/worker.ts',
        ],
        reporter: ['text', 'html', 'json-summary'],
        thresholds: COVERAGE_THRESHOLDS_PERCENT,
      },
    },
  };
});
