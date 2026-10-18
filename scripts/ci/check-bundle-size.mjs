// @ts-check
// Reports the size of the production build in the job summary. Fails when the scripts and style
// sheets that the home page loads first, or those of the whole build, exceed their gzip budget,
// and warns about large images. Run it after `pnpm build`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import {
  ASSETS_SUBDIR,
  DIST_DIR,
  HOME_PAGE_FILE,
  INITIAL_LOAD_BUDGET_GZIP_BYTES,
  LARGE_IMAGE_BYTES,
  PUBLIC_DIR,
  SCRIPT_BUDGET_GZIP_BYTES,
} from './constants.mjs';
import {
  checkScriptBudget,
  findLargeImages,
  findUncountedPaths,
  isBudgetedScript,
  readInitialLoadPaths,
  renderBundleReport,
  splitInitialLoad,
} from './utils/bundle.mjs';
import { appendJobSummary } from './utils/job-summary.mjs';
import { formatKilobytes } from './utils/numbers.mjs';

const homePage = join(DIST_DIR, HOME_PAGE_FILE);

if (!existsSync(homePage)) {
  console.log(`::error::${homePage} not found: run pnpm build first`);
  process.exit(1);
}

const files = readdirSync(DIST_DIR, { recursive: true })
  .map(path => String(path))
  .map(path => ({ path, stats: statSync(join(DIST_DIR, path)) }))
  .filter(({ stats }) => stats.isFile())
  .map(({ path, stats }) => ({ path, bytes: stats.size }));

const scripts = files
  .filter(({ path }) => isBudgetedScript(path))
  .map(file => ({ ...file, gzipBytes: gzipSync(readFileSync(join(DIST_DIR, file.path))).length }));
const initialPaths = readInitialLoadPaths(readFileSync(homePage, 'utf8'));
const largeImages = findLargeImages({ files, limitBytes: LARGE_IMAGE_BYTES });

appendJobSummary({
  markdown: renderBundleReport({
    scripts,
    initialPaths,
    budgetBytes: SCRIPT_BUDGET_GZIP_BYTES,
    initialLoadBudgetBytes: INITIAL_LOAD_BUDGET_GZIP_BYTES,
    largeImages,
    largeImageBytes: LARGE_IMAGE_BYTES,
  }),
});

largeImages.forEach(({ path, bytes }) => {
  // Annotate the source file when the image comes from public/
  const source = join(PUBLIC_DIR, path);
  const location = existsSync(source) ? ` file=${source}` : '';
  console.log(
    `::warning${location}::${path} weighs ${formatKilobytes(bytes)}, over ${formatKilobytes(LARGE_IMAGE_BYTES)}. Compress it or convert it to WebP or AVIF.`,
  );
});

findUncountedPaths({ scripts, initialPaths }).forEach(path => {
  console.log(
    `::warning::${HOME_PAGE_FILE} loads ${path}, which is not a script or style sheet of ${DIST_DIR}/${ASSETS_SUBDIR}/: the initial load leaves it out.`,
  );
});

const { initialScripts } = splitInitialLoad({ scripts, initialPaths });
const hasInitialScripts = initialScripts.length > 0;
if (!hasInitialScripts) {
  // The home page always loads the main chunk: finding none means the HTML is no longer read right
  console.log(
    `::error::${HOME_PAGE_FILE} references no script or style sheet of the build, so its initial load cannot be checked.`,
  );
  process.exitCode = 1;
}

const budgets = [
  {
    name: `Initial load of ${HOME_PAGE_FILE}`,
    budgetedScripts: initialScripts,
    budgetBytes: INITIAL_LOAD_BUDGET_GZIP_BYTES,
    advice: 'Load what the home page does not need with a lazy import, or remove code,',
  },
  {
    name: 'All scripts and styles',
    budgetedScripts: scripts,
    budgetBytes: SCRIPT_BUDGET_GZIP_BYTES,
    advice: 'Split the bundle or remove code',
  },
];

budgets.forEach(({ name, budgetedScripts, budgetBytes, advice }) => {
  const { totalGzipBytes, isOverBudget } = checkScriptBudget({
    scripts: budgetedScripts,
    budgetBytes,
  });
  const verdict = `${name}: ${formatKilobytes(totalGzipBytes)} gzip, for a budget of ${formatKilobytes(budgetBytes)}`;

  if (isOverBudget) {
    console.log(`::error::${verdict}. ${advice} before raising the budget.`);
    process.exitCode = 1;
  } else {
    console.log(`${verdict}.`);
  }
});
