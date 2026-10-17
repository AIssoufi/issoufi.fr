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

// https://vitejs.dev/config/
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
  },
});
