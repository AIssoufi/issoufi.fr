import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

import { ALL_ENV_VARIABLES_PREFIX } from './vite/constants.ts';
import { getServerPorts } from './vite/utils/ports.ts';

/** Mode whose `.env` files `vite preview` reads by default, `.env.local` included. */
const PREVIEW_MODE = 'production';

/**
 * Time a test of WebKit may take, twice the 30 s of Playwright: WebKit draws in software on the
 * Linux of the CI, where a test that loads `/experiences` four times ran past those 30 s, against
 * 4 s on a Mac.
 */
const WEBKIT_TEST_TIMEOUT_MS = 60_000;

const isCI = Boolean(process.env.CI);
const { preview: port } = getServerPorts(
  loadEnv(PREVIEW_MODE, process.cwd(), ALL_ENV_VARIABLES_PREFIX),
);
const baseURL = `http://localhost:${port}`;

/**
 * Server of the browser tests: `pnpm preview`, which serves the production build of the folder it
 * runs in, `dist/`, on the port of the worktree. The screenshot comparison
 * (`playwright.visual.config.ts`) runs it in the checkout of the base of the change too.
 */
export const PREVIEW_SERVER = {
  // A taken port fails at once rather than moving the server to another port
  command: `pnpm preview --port ${port} --strictPort`,
  url: baseURL,
  // Never tests a server that already holds the port, such as pnpm dev or another worktree's
  reuseExistingServer: false,
};

/** Project of every browser test, in the Chromium of a desktop computer. */
export const CHROMIUM_PROJECT = { name: 'chromium', use: { ...devices['Desktop Chrome'] } };

/**
 * Project of the phone tests in WebKit, the engine of Safari, on an iPhone: the specs that check
 * the layout, the menu and the touch targets of a phone, where Safari differs the most from
 * Chromium, the redirects that it follows and the cache of its fonts. Each spec that depends on
 * the size of the screen still sets it.
 */
const WEBKIT_PROJECT = {
  name: 'webkit',
  testMatch: [
    '**/axe.e2e.ts',
    '**/font-cache.e2e.ts',
    '**/horizontal-overflow.e2e.ts',
    '**/mobile-menu.e2e.ts',
    '**/no-script-navigation.e2e.ts',
    '**/redirects.e2e.ts',
    '**/touch-targets.e2e.ts',
  ],
  timeout: WEBKIT_TEST_TIMEOUT_MS,
  use: {
    ...devices['iPhone 13'],
    // The specs measure CSS pixels, and WebKit draws in software on the Linux of the CI, where the
    // scale of 3 of an iPhone draws nine times as many pixels and ran past the timeouts
    deviceScaleFactor: 1,
  },
};

/**
 * Playwright configuration of the browser tests of `e2e/` (`pnpm test:browser`): every spec in
 * Chromium, and the phone specs in WebKit too, on the production build that `pnpm preview` serves
 * on the port of the worktree (see {@link getServerPorts}), so `pnpm build` must run first. A
 * failed test saves a screenshot of the whole page in `test-results/`.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: 'e2e',
  // The *.spec.ts files of e2e/ are the Vitest tests of its helpers
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: isCI,
  reporter: isCI ? [['list'], ['github']] : 'list',
  use: {
    baseURL,
    screenshot: { mode: 'only-on-failure', fullPage: true },
  },
  projects: [CHROMIUM_PROJECT, WEBKIT_PROJECT],
  webServer: PREVIEW_SERVER,
});
