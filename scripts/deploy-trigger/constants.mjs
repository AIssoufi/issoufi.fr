// @ts-check
import { SCHEDULED_INPUT } from '../ci/constants.mjs';

/** Repository whose deploy workflow the trigger starts, as `owner/name`. */
export const DEPLOY_REPOSITORY = 'AIssoufi/issoufi.fr';

/**
 * Secret of the Worker that holds the token it starts the deploy workflow with: a fine-grained
 * personal access token limited to {@link DEPLOY_REPOSITORY}, with the _Actions: Read and write_
 * permission only, which the site owner stores with `wrangler secret put` (docs/deployment.md).
 */
export const DISPATCH_TOKEN_SECRET = 'GITHUB_DISPATCH_TOKEN';

/**
 * Length of the window in which the trigger starts the daily deploy, in minutes after its earliest
 * time (`DEPLOY_START_MINUTES`, 6:00 in Paris): 6:00 to 7:00. Cloudflare reads the crons of
 * `wrangler.jsonc` in UTC, so they fire at 4:05, 4:35, 5:05 and 5:35 UTC, and the two that fall
 * in the window start a run, at 6:05 and 6:35 in Paris: those of 4:xx UTC in summer (UTC+2), and
 * those of 5:xx UTC in winter (UTC+1).
 */
export const DEPLOY_WINDOW_MINUTES = 60;

/**
 * Inputs of the runs that the trigger starts: scheduled runs, which the schedule check stops once
 * a scheduled run of the day passed, as it does for the crons of the workflow.
 */
export const SCHEDULED_RUN_INPUTS = { [SCHEDULED_INPUT]: 'true' };
