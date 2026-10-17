// @ts-check
// Reports the size of the production build in the job summary. Fails when the scripts and style
// sheets exceed their gzip budget, and warns about large images. Run it after `pnpm build`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import {
  ASSETS_SUBDIR,
  DIST_DIR,
  LARGE_IMAGE_BYTES,
  PUBLIC_DIR,
  SCRIPT_BUDGET_GZIP_BYTES,
  SCRIPT_FILE_PATTERN,
} from './constants.mjs';
import {
  appendJobSummary,
  checkScriptBudget,
  findLargeImages,
  formatKilobytes,
  renderBundleReport,
} from './utils.mjs';

if (!existsSync(DIST_DIR)) {
  console.log(`::error::${DIST_DIR}/ not found: run pnpm build first`);
  process.exit(1);
}

const files = readdirSync(DIST_DIR, { recursive: true })
  .map(path => String(path))
  .map(path => ({ path, stats: statSync(join(DIST_DIR, path)) }))
  .filter(({ stats }) => stats.isFile())
  .map(({ path, stats }) => ({ path, bytes: stats.size }));

const scripts = files
  .filter(({ path }) => path.startsWith(`${ASSETS_SUBDIR}/`) && SCRIPT_FILE_PATTERN.test(path))
  .map(file => ({ ...file, gzipBytes: gzipSync(readFileSync(join(DIST_DIR, file.path))).length }));
const largeImages = findLargeImages({ files, limitBytes: LARGE_IMAGE_BYTES });

appendJobSummary({
  markdown: renderBundleReport({
    scripts,
    budgetBytes: SCRIPT_BUDGET_GZIP_BYTES,
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

const { totalGzipBytes, isOverBudget } = checkScriptBudget({
  scripts,
  budgetBytes: SCRIPT_BUDGET_GZIP_BYTES,
});
const verdict = `Scripts and styles weigh ${formatKilobytes(totalGzipBytes)} gzip, for a budget of ${formatKilobytes(SCRIPT_BUDGET_GZIP_BYTES)}`;

if (isOverBudget) {
  console.log(`::error::${verdict}. Split the bundle or remove code before raising the budget.`);
  process.exitCode = 1;
} else {
  console.log(`${verdict}.`);
}
