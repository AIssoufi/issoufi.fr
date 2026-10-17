import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import svgr from 'vite-plugin-svgr';

import { getYearsOfExperience } from './src/utils/career';
import { NOT_FOUND_FILE_NAME, PAGES, renderNotFoundHtml, renderPageHtml } from './src/utils/pages';
import { ALL_ENV_VARIABLES_PREFIX, ASSETS_DIR } from './vite/constants';
import { getChunkName, getServerPorts } from './vite/utils';

/**
 * Vite plugin that fills the metadata of `index.html` for the home page, then emits one HTML
 * file per other page and a `404.html` from the same template. It runs after Vite's own HTML
 * plugin (`enforce: 'post'`), so the template already contains the hashed asset tags.
 */
const pageMeta = (): Plugin => {
  let template = '';

  return {
    name: 'page-meta',
    enforce: 'post',
    transformIndexHtml: html => {
      template = html;
      return renderPageHtml({ template: html, page: PAGES[0], years: getYearsOfExperience() });
    },
    generateBundle() {
      if (!template) this.error('index.html was not transformed before generateBundle');

      PAGES.slice(1).forEach(page => {
        this.emitFile({
          type: 'asset',
          fileName: page.fileName,
          source: renderPageHtml({ template, page, years: getYearsOfExperience() }),
        });
      });

      this.emitFile({
        type: 'asset',
        fileName: NOT_FOUND_FILE_NAME,
        source: renderNotFoundHtml({ template, years: getYearsOfExperience() }),
      });
    },
  };
};

/**
 * Minimum test coverage, in percent, below which `pnpm test:coverage` fails. Set under the
 * coverage of October 2026, Vite and CI helpers included, as measured by Vitest 4 (97.2% of
 * lines, 96.8% of statements, 95.2% of branches, 93.7% of functions), so a change that drops
 * tests fails the CI. Vitest 4 maps the V8 coverage onto the syntax tree and counts only the
 * executable code, so its figures differ from those of Vitest 3 for the same tests. Raise them
 * when the coverage goes up.
 */
const COVERAGE_THRESHOLDS_PERCENT = { lines: 95, statements: 95, branches: 95, functions: 85 };

/**
 * Vite and Vitest configuration: React with SVG components, the page metadata plugin, the dev
 * and preview servers on the port of the worktree (see {@link getServerPorts}), which fail when
 * it is taken, and the tests in jsdom with coverage.
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
  const ports = getServerPorts(loadEnv(mode, process.cwd(), ALL_ENV_VARIABLES_PREFIX));

  return {
    base: '/',
    plugins: [react(), svgr(), pageMeta()],
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
      coverage: {
        provider: 'v8',
        // The helpers of the CI scripts are measured, not the entry scripts that run them
        include: ['src/**/*.{ts,tsx}', 'vite/**/*.ts', 'scripts/ci/utils/**/*.mjs'],
        // The entry point only mounts the app, which App.spec.jsx renders
        exclude: ['**/*.spec.*', '**/index.ts', '**/*.d.ts', 'src/setupTests.ts', 'src/index.tsx'],
        reporter: ['text', 'html', 'json-summary'],
        thresholds: COVERAGE_THRESHOLDS_PERCENT,
      },
    },
  };
});
