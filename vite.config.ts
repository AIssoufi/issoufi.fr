import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import svgr from 'vite-plugin-svgr';

import { getYearsOfExperience } from './src/utils/career';

// Replaces %YEARS_OF_EXPERIENCE% in index.html, so the static meta tags are up to date at each build
const injectYearsOfExperience = (): Plugin => ({
  name: 'inject-years-of-experience',
  transformIndexHtml: html =>
    html.replace(/%YEARS_OF_EXPERIENCE%/g, String(getYearsOfExperience())),
});

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), svgr(), injectYearsOfExperience()],
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
