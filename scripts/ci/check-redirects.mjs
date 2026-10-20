// @ts-check
// Checks that the other addresses of the production site, REDIRECTED_SITE_URLS of constants.mjs
// (http://issoufi.fr/, http://www.issoufi.fr/ and https://www.issoufi.fr/), redirect to SITE_URL
// (https://issoufi.fr/) in one hop, and writes an error annotation for each one that does not.
// Run it after the deploy of main.
// Usage: node scripts/ci/check-redirects.mjs
import { REDIRECTED_SITE_URLS, SITE_URL } from './constants.mjs';
import { writeAnnotation } from './utils/annotations.mjs';
import { checkRedirect } from './utils/redirects.mjs';

const results = await Promise.all(
  REDIRECTED_SITE_URLS.map(url => checkRedirect({ url, expectedUrl: SITE_URL })),
);
const problems = results.flat();

if (problems.length === 0) {
  const redirectedUrls = new Intl.ListFormat('en').format(REDIRECTED_SITE_URLS);
  console.log(`${redirectedUrls} redirect to ${SITE_URL} in one hop.`);
} else {
  problems.forEach(problem => writeAnnotation({ level: 'error', message: problem }));
  process.exitCode = 1;
}
