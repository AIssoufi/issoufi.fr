// @ts-check
// Reports the size of the production build in the job summary. Fails when the scripts and style
// sheets that the home page loads first, or those of the whole build, exceed their gzip budget,
// and warns about the other large files, such as images or the CV. Run it after `pnpm build`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import {
  ASSETS_SUBDIR,
  DIST_DIR,
  HOME_PAGE_FILE,
  INITIAL_LOAD_BUDGET_GZIP_BYTES,
  LARGE_FILE_BYTES,
  MISSING_INITIAL_LOAD_REASON,
  PUBLIC_DIR,
  SCRIPT_BUDGET_GZIP_BYTES,
} from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { checkBundleBudgets } from './utils/bundle-budgets.mjs';
import { isBudgetedScript } from './utils/bundle-files.mjs';
import { findUncountedPaths } from './utils/bundle-initial-load.mjs';
import { findLargeFiles, getCompressionAdvice } from './utils/bundle-large-files.mjs';
import { renderBundleReport } from './utils/bundle-report.mjs';
import { readInitialLoadPaths } from './utils/html.mjs';
import { appendJobSummary } from './utils/job-summary.mjs';
import { formatKilobytes } from './utils/numbers.mjs';

const homePage = join(DIST_DIR, HOME_PAGE_FILE);

if (!existsSync(homePage)) {
  writeAnnotation({ level: 'error', message: `${homePage} not found: run pnpm build first` });
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
const largeFiles = findLargeFiles({ files, limitBytes: LARGE_FILE_BYTES });

appendJobSummary({
  markdown: renderBundleReport({
    scripts,
    initialPaths,
    budgetBytes: SCRIPT_BUDGET_GZIP_BYTES,
    initialLoadBudgetBytes: INITIAL_LOAD_BUDGET_GZIP_BYTES,
    largeFiles,
    largeFileBytes: LARGE_FILE_BYTES,
  }),
});

largeFiles.forEach(({ path, bytes }) => {
  // Annotate the source file when the file comes from public/
  const source = join(PUBLIC_DIR, path);
  const isPublicFile = existsSync(source);
  writeAnnotation({
    level: 'warning',
    message: `${path} weighs ${formatKilobytes(bytes)}, over ${formatKilobytes(LARGE_FILE_BYTES)}. ${getCompressionAdvice(path)}`,
    properties: { file: isPublicFile ? source : undefined },
  });
});

findUncountedPaths({ scripts, initialPaths }).forEach(path => {
  writeAnnotation({
    level: 'warning',
    message: `${HOME_PAGE_FILE} loads ${path}, which is not a script or style sheet of ${DIST_DIR}/${ASSETS_SUBDIR}/: the initial load leaves it out.`,
  });
});

const { hasInitialLoad, initialLoad, total } = checkBundleBudgets({
  scripts,
  initialPaths,
  budgetBytes: SCRIPT_BUDGET_GZIP_BYTES,
  initialLoadBudgetBytes: INITIAL_LOAD_BUDGET_GZIP_BYTES,
});

if (!hasInitialLoad) {
  writeAnnotation({
    level: 'error',
    message: `${HOME_PAGE_FILE} ${MISSING_INITIAL_LOAD_REASON}, so its initial load cannot be checked.`,
  });
  process.exitCode = 1;
}

const initialLoadBudget = {
  name: `Initial load of ${HOME_PAGE_FILE}`,
  check: initialLoad,
  budgetBytes: INITIAL_LOAD_BUDGET_GZIP_BYTES,
  advice: 'Load what the home page does not need with a lazy import, or remove code,',
};
const totalBudget = {
  name: 'All scripts and styles',
  check: total,
  budgetBytes: SCRIPT_BUDGET_GZIP_BYTES,
  advice: 'Split the bundle or remove code',
};
// Without an initial load, the error above replaces its verdict
const budgets = hasInitialLoad ? [initialLoadBudget, totalBudget] : [totalBudget];

budgets.forEach(({ name, check: { totalGzipBytes, isOverBudget }, budgetBytes, advice }) => {
  const verdict = `${name}: ${formatKilobytes(totalGzipBytes)} gzip, for a budget of ${formatKilobytes(budgetBytes)}`;

  if (isOverBudget) {
    writeAnnotation({
      level: 'error',
      message: `${verdict}. ${advice} before raising the budget.`,
    });
    process.exitCode = 1;
  } else {
    console.log(`${verdict}.`);
  }
});
