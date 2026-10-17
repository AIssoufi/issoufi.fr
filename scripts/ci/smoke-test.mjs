// @ts-check
// Checks that a deployed site serves the pages of the local build: every page of dist/ at its
// route with a 200, and the not found page with a 404, each with the title and canonical URL of
// the build. Retries for a while, since a new deployment can take a moment to spread.
// Usage: node scripts/ci/smoke-test.mjs <site URL>
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

import { DIST_DIR, SMOKE_TEST_ATTEMPTS, SMOKE_TEST_RETRY_DELAY_MS } from './constants.mjs';
import { appendJobSummary } from './utils/job-summary.mjs';
import { comparePage, getPageChecks, renderSmokeTestReport } from './utils/pages.mjs';

const siteUrl = process.argv[2];

const isValidSiteUrl = URL.canParse(siteUrl ?? '');
if (!isValidSiteUrl) {
  console.log(`::error::Invalid site URL "${siteUrl ?? ''}". Usage: smoke-test.mjs <site URL>`);
  process.exit(1);
}

if (!existsSync(DIST_DIR)) {
  console.log(`::error::${DIST_DIR}/ not found: run pnpm build first`);
  process.exit(1);
}

const pages = getPageChecks(readdirSync(DIST_DIR));

// Without pages, the smoke test would pass after checking nothing
const hasPages = pages.length > 0;
if (!hasPages) {
  console.log(`::error::${DIST_DIR}/ has no HTML page to check: run pnpm build first`);
  process.exit(1);
}

/** @returns {Promise<string[]>} The problems found on every page, empty when all pass. */
const checkSite = async () => {
  const results = await Promise.all(
    pages.map(async page => {
      try {
        // A redirect would hide a route that is not served directly, so it is not followed
        const response = await fetch(new URL(page.route, siteUrl), { redirect: 'manual' });
        return comparePage({
          page,
          status: response.status,
          servedHtml: await response.text(),
          builtHtml: readFileSync(join(DIST_DIR, page.file), 'utf8'),
        });
      } catch (error) {
        return [
          `${page.route}: request failed (${error instanceof Error ? error.message : error})`,
        ];
      }
    }),
  );
  return results.flat();
};

/** @type {string[]} */
let problems = [];

for (let attempt = 1; attempt <= SMOKE_TEST_ATTEMPTS; attempt += 1) {
  problems = await checkSite();
  if (problems.length === 0) break;

  console.log(`Attempt ${attempt}/${SMOKE_TEST_ATTEMPTS}: ${problems.length} problem(s)`);
  if (attempt < SMOKE_TEST_ATTEMPTS) await sleep(SMOKE_TEST_RETRY_DELAY_MS);
}

if (problems.length === 0) {
  console.log(`${siteUrl} serves the ${pages.length} pages of the build.`);
} else {
  problems.forEach(problem => console.log(`::error::${problem}`));
  process.exitCode = 1;
}

appendJobSummary({ markdown: renderSmokeTestReport({ siteUrl, pages, problems }) });
