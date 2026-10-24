// @ts-check
// Fails when a workflow or an action of .github/ references an action of a third party or a
// reusable workflow by a tag or a branch, which their owner can move, instead of the SHA of a
// commit, or a Docker image by a tag instead of its digest (ADR 0019). The actions of GitHub
// (actions/*) and of this repository (./) pass. The images of the container and of the services
// of a job need their digest too. Writes an error annotation on the line of each `uses:` key, or
// of each image, that pins nothing. Run it from the project root.
// Usage: node scripts/ci/check-action-pins.mjs
import { readFileSync } from 'node:fs';

import { GITHUB_DIR } from './constants.mjs';
import { describePinProblem, findUsesReferences } from './utils/action-pins.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { describeImagePinProblem, findJobImages } from './utils/image-pins.mjs';
import { listYamlFiles } from './utils/yaml.mjs';

const files = listYamlFiles();
const sources = files.map(file => ({ file, source: readFileSync(file, 'utf8') }));
const references = sources.flatMap(({ file, source }) =>
  findUsesReferences(source).map(reference => ({ ...reference, file })),
);
const images = sources.flatMap(({ file, source }) =>
  findJobImages(source).map(image => ({ ...image, file })),
);
const actionProblems = references.flatMap(({ file, line, column, reference }) => {
  const message = describePinProblem(reference);
  return message ? [{ file, line, column, message, title: 'Unpinned action' }] : [];
});
const imageProblems = images.flatMap(({ file, line, column, ...image }) => {
  const message = describeImagePinProblem(image);
  return message ? [{ file, line, column, message, title: 'Unpinned image' }] : [];
});
const problems = [...actionProblems, ...imageProblems];

if (problems.length === 0) {
  console.log(
    `The ${references.length} uses: keys and the ${images.length} images of the jobs of the ${files.length} YAML files of ${GITHUB_DIR}/ pin what they run.`,
  );
} else {
  problems.forEach(({ file, line, column, message, title }) =>
    writeAnnotation({ level: 'error', message, properties: { file, line, col: column, title } }),
  );
  process.exitCode = 1;
}
