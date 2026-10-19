import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite';

import { ALL_ENV_VARIABLES_PREFIX } from './vite/constants';
import { getServerPorts } from './vite/utils';

/** Mode whose `.env` files `vite preview` reads by default, `.env.local` included. */
const PREVIEW_MODE = 'production';

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

/**
 * Playwright configuration of the browser tests of `e2e/` (`pnpm test:browser`): Chromium only,
 * on the production build that `pnpm preview` serves on the port of the worktree (see
 * {@link getServerPorts}), so `pnpm build` must run first. A failed test saves a screenshot of the
 * whole page in `test-results/`.
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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: PREVIEW_SERVER,
});
