import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import svgr from 'vite-plugin-svgr';

import packageJson from './package.json';
import { DEFAULT_LANGUAGE } from './src/i18n/constants';
import { getYearsOfExperience } from './src/utils/career';
import { addModulePreload, renderNotFoundHtml, renderPageHtml } from './src/utils/pageHtml';
import {
  getNotFoundFiles,
  getPageFiles,
  HOME_PAGE,
  isTemplatePageFile,
  NOT_FOUND_FOLDER,
} from './src/utils/pages';
import { renderSitemap, SITEMAP_FILE_NAME } from './src/utils/sitemap';
import { ALL_ENV_VARIABLES_PREFIX, ASSETS_DIR } from './vite/constants';
import { getChunkName, getFontFaceTags, getPageChunkFile, getServerPorts } from './vite/utils';

/**
 * Vite plugin that adds the web fonts of the site to the head of `index.html`, in development as
 * in the build: a link that preloads each font file, then a `<style>` of their `@font-face` rules
 * (see {@link getFontFaceTags}). It runs before {@link pageMeta}, which emits every other page
 * from the same head.
 */
const fontFaces = (): Plugin => ({
  name: 'font-faces',
  transformIndexHtml: () => getFontFaceTags(),
});

/** Parameters of the `preloadPageChunk` helper of {@link pageMeta}. */
interface PreloadPageChunkParams {
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
 * the page it shows, so a direct visit downloads it at the same time as the main chunk; the home
 * page is in the main chunk and needs none.
 */
const pageMeta = (): Plugin => {
  let template = '';
  let base = '/';

  return {
    name: 'page-meta',
    enforce: 'post',
    configResolved: config => {
      base = config.base;
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
    generateBundle(_options, bundle) {
      if (!template) this.error('index.html was not transformed before generateBundle');

      /** Preloads in a generated page the chunk of the page in `folder`, when it has one. */
      const preloadPageChunk = ({ html, folder }: PreloadPageChunkParams) => {
        const chunkFile = getPageChunkFile({ bundle, folder });
        return chunkFile ? addModulePreload({ html, href: `${base}${chunkFile}` }) : html;
      };

      const years = getYearsOfExperience();

      getPageFiles()
        .filter(file => !isTemplatePageFile(file))
        .forEach(({ page, language, fileName }) => {
          const html = renderPageHtml({ template, page, language, years });
          this.emitFile({
            type: 'asset',
            fileName,
            source: preloadPageChunk({ html, folder: page.folder }),
          });
        });

      getNotFoundFiles().forEach(({ language, fileName }) => {
        const html = renderNotFoundHtml({ template, language, years });
        this.emitFile({
          type: 'asset',
          fileName,
          source: preloadPageChunk({ html, folder: NOT_FOUND_FOLDER }),
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
 * Minimum test coverage, in percent, below which `pnpm test:coverage` fails. Set two to three
 * points under the coverage of October 2026, Vite and CI helpers included, as measured by
 * Vitest 4 (99.6% of lines, 99.4% of statements, 98.8% of branches, 98.3% of functions), so a
 * change that drops tests fails the CI while a few untested lines of a new change do not.
 * Vitest 4 maps the V8 coverage onto the syntax tree and counts only the executable code, so its
 * figures differ from those of Vitest 3 for the same tests. Raise them when the coverage goes up.
 */
const COVERAGE_THRESHOLDS_PERCENT = { lines: 97, statements: 97, branches: 96, functions: 96 };

/**
 * Vite and Vitest configuration: React with SVG components, the web fonts, page metadata and
 * sitemap plugins, the dev and preview servers on the port of the worktree (see
 * {@link getServerPorts}), which fail when it is taken, and the tests in jsdom with coverage.
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
  const ports = getServerPorts(loadEnv(mode, process.cwd(), ALL_ENV_VARIABLES_PREFIX));

  return {
    base: '/',
    plugins: [react(), svgr(), fontFaces(), pageMeta(), sitemap()],
    // The version that release-please writes in package.json, shown after the logo of the header
    // (src/App/Header) and typed in src/vite-env.d.ts; the tests read it too
    define: { __APP_VERSION__: JSON.stringify(packageJson.version) },
    build: {
      rollupOptions: {
        // The chunk of each lazily loaded page is named after its folder, not after its index file
        output: { chunkFileNames: chunk => `${ASSETS_DIR}/${getChunkName(chunk)}-[hash].js` },
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
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      // styled-components inserts each rule into the CSSOM, as in production, rather than adding
      // its text to a <style>, which jsdom parses again whole on every change: a quadratic cost
      // that made the tests several times slower since jsdom 29
      env: { SC_DISABLE_SPEEDY: 'false' },
      coverage: {
        provider: 'v8',
        // The helpers of the scripts and of the browser tests are measured, not the scripts and the
        // Playwright tests that use them
        include: [
          'src/**/*.{ts,tsx}',
          'vite/**/*.ts',
          'e2e/**/*.ts',
          'scripts/ci/utils/**/*.mjs',
          'scripts/og-image/utils/**/*.mjs',
        ],
        exclude: [
          '**/*.spec.*',
          // The browser tests run in Playwright, not in Vitest
          '**/*.e2e.ts',
          '**/index.ts',
          '**/*.d.ts',
          'src/setupTests.ts',
          // The entry point only mounts the app, which App.spec.jsx renders
          'src/index.tsx',
        ],
        reporter: ['text', 'html', 'json-summary'],
        thresholds: COVERAGE_THRESHOLDS_PERCENT,
      },
    },
  };
});
