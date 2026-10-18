// @ts-check
// Checks that the other addresses of the production site, REDIRECTED_SITE_URLS of constants.mjs
// (http://issoufi.fr/ and https://www.issoufi.fr/), redirect to SITE_URL (https://issoufi.fr/), and
// writes an error annotation for each one that does not. Run it after the deploy of main.
// Usage: node scripts/ci/check-redirects.mjs
import { REDIRECTED_SITE_URLS, SITE_URL } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { checkRedirect } from './utils/redirects.mjs';

const results = await Promise.all(
  REDIRECTED_SITE_URLS.map(url => checkRedirect({ url, expectedUrl: SITE_URL })),
);
const problems = results.flat();

if (problems.length === 0) {
  console.log(`${REDIRECTED_SITE_URLS.join(' and ')} redirect to ${SITE_URL}.`);
} else {
  problems.forEach(problem => writeAnnotation({ level: 'error', message: problem }));
  process.exitCode = 1;
}
