// @ts-check
// Releases the version of the day in deploy-production.yml, before the production deploy: merges
// the release pull request that release-please keeps open against develop once its CI passed and
// GitHub says it can merge, approving that CI first when GitHub holds it, then publishes the
// release (release.yml) and runs the CI on develop, so that the deploy finds the new commit of
// develop tested (see releaseVersionOfTheDay in utils/daily-release.mjs). It never fails the
// deploy: a release that cannot be made leaves a notice, or a warning when someone has to act.
// With DRY_RUN=true, it goes as far as the merge, which it leaves out.
// Usage: DRY_RUN=<true|false> GITHUB_REPOSITORY=<owner/name> GITHUB_TOKEN=<token> \
//   node scripts/ci/merge-release-pr.mjs
import { writeAnnotation } from './utils/annotations.mjs';
import { releaseVersionOfTheDay } from './utils/daily-release.mjs';

try {
  writeAnnotation(await releaseVersionOfTheDay({ isDryRun: process.env.DRY_RUN === 'true' }));
} catch (error) {
  // The deploy goes on: a release pull request left open is merged by the next run
  const reason = error instanceof Error ? error.message : error;
  writeAnnotation({ level: 'warning', message: `The daily release stopped: ${reason}` });
}
