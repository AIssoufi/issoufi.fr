// @ts-check
// Fails when a workflow or an action of .github/ references an action of a third party or a
// reusable workflow by a tag or a branch, which their owner can move, instead of the SHA of a
// commit, or a Docker image by a tag instead of its digest (ADR 0019). The actions of GitHub
// (actions/*) and of this repository (./) pass. Writes an error annotation on the line of each
// `uses:` key that pins nothing. Run it from the project root.
// Usage: node scripts/ci/check-action-pins.mjs
import { readFileSync } from 'node:fs';

import { GITHUB_DIR } from './constants.mjs';
import { describePinProblem, findUsesReferences, listYamlFiles } from './utils/action-pins.mjs';
import { writeAnnotation } from './utils/annotations.mjs';

const files = listYamlFiles();
const references = files.flatMap(file =>
  findUsesReferences(readFileSync(file, 'utf8')).map(reference => ({ ...reference, file })),
);
const problems = references.flatMap(({ file, line, column, reference }) => {
  const message = describePinProblem(reference);
  return message ? [{ file, line, column, message }] : [];
});

if (problems.length === 0) {
  console.log(
    `The ${references.length} uses: keys of the ${files.length} YAML files of ${GITHUB_DIR}/ pin what they run.`,
  );
} else {
  problems.forEach(({ file, line, column, message }) =>
    writeAnnotation({
      level: 'error',
      message,
      properties: { file, line, col: column, title: 'Unpinned action' },
    }),
  );
  process.exitCode = 1;
}
