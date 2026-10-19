import { defineConfig } from '@playwright/test';

import browserTestConfig, { PREVIEW_SERVER } from './playwright.config';

/**
 * Environment variable naming the folder of the checkout whose build the screenshots show, which
 * `scripts/ci/compare-screenshots.mjs` sets to the checkout of the base of the change, then
 * leaves out for the working tree. Defaults to the current folder.
 */
const SITE_DIR_VARIABLE = 'VISUAL_SITE_DIR';

/** Folder of the files of the comparison, out of git and of the tools that read the project. */
const VISUAL_CACHE_DIR = 'node_modules/.cache/visual';

/**
 * Playwright configuration of the screenshot comparison of `e2e/*.visual.ts`, run twice by
 * `pnpm test:visual` (`scripts/ci/compare-screenshots.mjs`): on the build of the base of the
 * change, to write the screenshots that `toHaveScreenshot` expects, then on the build of the
 * working tree, to compare them. It extends the configuration of the browser tests
 * (`playwright.config.ts`), its Chromium and its preview server, run in the folder of
 * {@link SITE_DIR_VARIABLE}. Nothing is stored in git: the expected screenshots live in
 * {@link VISUAL_CACHE_DIR} for the time of a run.
 * @see https://playwright.dev/docs/test-snapshots
 */
export default defineConfig({
  ...browserTestConfig,
  testMatch: '**/*.visual.ts',
  // A retry would hide a screen that does not render the same twice
  retries: 0,
  reporter: 'list',
  outputDir: `${VISUAL_CACHE_DIR}/test-results`,
  snapshotPathTemplate: `${VISUAL_CACHE_DIR}/screenshots/{arg}{ext}`,
  expect: {
    // Every pixel counts: both builds are drawn by the same browser on the same machine
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixels: 0 },
  },
  use: {
    ...browserTestConfig.use,
    // The comparison is the screenshot itself, and the motion of the pages would make it differ
    screenshot: 'off',
    reducedMotion: 'reduce',
  },
  webServer: { ...PREVIEW_SERVER, cwd: process.env[SITE_DIR_VARIABLE] || '.' },
});
