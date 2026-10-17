import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import svgr from 'vite-plugin-svgr';

import { getYearsOfExperience } from './src/utils/career';
import { NOT_FOUND_FILE_NAME, PAGES, renderNotFoundHtml, renderPageHtml } from './src/utils/pages';

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
 * Minimum test coverage, in percent, below which `pnpm test:coverage` fails. Set a few points
 * under the coverage of October 2026, CI helpers included (98.4% of lines, 97.8% of branches,
 * 93.3% of functions), so a change that drops tests fails the CI. Raise them when the coverage
 * goes up.
 */
const COVERAGE_THRESHOLDS_PERCENT = { lines: 95, statements: 95, branches: 95, functions: 85 };

/**
 * Vite and Vitest configuration: React with SVG components, the page metadata plugin, the dev
 * server on port 3000, and the tests in jsdom with coverage.
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  base: '/',
  plugins: [react(), svgr(), pageMeta()],
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      // The helpers of the CI scripts are measured, not the entry scripts that run them
      include: ['src/**/*.{ts,tsx}', 'scripts/ci/utils/**/*.mjs'],
      // The entry point only mounts the app, which App.spec.jsx renders
      exclude: ['**/*.spec.*', '**/index.ts', '**/*.d.ts', 'src/setupTests.ts', 'src/index.tsx'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: COVERAGE_THRESHOLDS_PERCENT,
    },
  },
});
