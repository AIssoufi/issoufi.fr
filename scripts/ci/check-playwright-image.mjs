// @ts-check
// Fails when an image of Playwright that a workflow or an action of .github/ names, such as the
// container of the WebKit job of ci.yml, has a tag of another version than the one of
// @playwright/test in pnpm-lock.yaml: its browsers would not launch, and Dependabot updates the
// lockfile but not the tag. Also fails when the lockfile lists no version of @playwright/test, and
// when no workflow names an image of Playwright, which leaves the check nothing to compare. Writes
// an error annotation on the line of each image of another version, with the tag to write and the
// command that prints its digest. Run it from the project root.
// Usage: node scripts/ci/check-playwright-image.mjs
import { readFileSync } from 'node:fs';

import { GITHUB_DIR } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { PLAYWRIGHT_PACKAGE, PNPM_LOCKFILE } from './utils/constants.mjs';
import { findPlaywrightImages, findVersionProblems } from './utils/playwright-image.mjs';
import { readLockedVersion } from './utils/pnpm-lockfile.mjs';
import { listYamlFiles } from './utils/yaml.mjs';

const files = listYamlFiles();
const images = files.flatMap(file =>
  findPlaywrightImages(readFileSync(file, 'utf8')).map(image => ({ ...image, file })),
);
const lockedVersion = readLockedVersion({
  source: readFileSync(PNPM_LOCKFILE, 'utf8'),
  packageName: PLAYWRIGHT_PACKAGE,
});
const problems = findVersionProblems({ images, lockedVersion });

if (problems.length === 0) {
  console.log(
    `The ${images.length} images of Playwright of the ${files.length} YAML files of ${GITHUB_DIR}/` +
      ` run ${PLAYWRIGHT_PACKAGE} ${lockedVersion}, the version of ${PNPM_LOCKFILE}.`,
  );
} else {
  problems.forEach(({ file, line, column, message }) =>
    writeAnnotation({
      level: 'error',
      message,
      properties: { file, line, col: column, title: 'Playwright image' },
    }),
  );
  process.exitCode = 1;
}
