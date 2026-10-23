// @ts-check
// Fails when a step of a workflow or of an action of .github/ runs actions/checkout without
// persist-credentials: false, which keeps the token of its job, or its SSH key, in the git config
// for every later step of the job. A checkout that a later step needs, to fetch or to push with
// git, sets persist-credentials: true with a comment that names that step. Writes an error
// annotation on the line of the input, or of the uses: key when the step sets none. Run it from
// the project root.
// Usage: node scripts/ci/check-checkout-credentials.mjs
import { readFileSync } from 'node:fs';

import { GITHUB_DIR } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { describeCredentialsProblem, findCheckoutSteps } from './utils/checkout-credentials.mjs';
import { listYamlFiles } from './utils/yaml.mjs';

const files = listYamlFiles();
const steps = files.flatMap(file =>
  findCheckoutSteps(readFileSync(file, 'utf8')).map(step => ({ ...step, file })),
);
const problems = steps.flatMap(step => {
  const message = describeCredentialsProblem(step);
  const { line, column } = step.persistCredentials ?? step;
  return message ? [{ file: step.file, line, column, message }] : [];
});

if (problems.length === 0) {
  console.log(
    `The ${steps.length} checkouts of the ${files.length} YAML files of ${GITHUB_DIR}/ drop` +
      ' their git credentials, or say which step uses them.',
  );
} else {
  problems.forEach(({ file, line, column, message }) =>
    writeAnnotation({
      level: 'error',
      message,
      properties: { file, line, col: column, title: 'Checkout credentials' },
    }),
  );
  process.exitCode = 1;
}
