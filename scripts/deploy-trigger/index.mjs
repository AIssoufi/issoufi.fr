// @ts-check
// Cloudflare Worker that starts the daily production deploy from outside GitHub, whose scheduler
// delays or drops the runs of the crons of deploy-production.yml: its Cron Triggers
// (wrangler.jsonc) start the workflow on develop at 6:05 and 6:35 in Paris (see
// triggerDailyDeploy). The site owner deploys it, never the CI (docs/deployment.md).
import { DISPATCH_TOKEN_SECRET } from './constants.mjs';
import { triggerDailyDeploy } from './utils.mjs';

/**
 * Event of a Cron Trigger, which Cloudflare passes to the `scheduled` handler of the Worker.
 * @typedef {object} ScheduledController
 * @property {number} scheduledTime - Moment the cron fired, in milliseconds since the epoch.
 */

/** The Worker: Cloudflare calls its `scheduled` handler at each cron of `wrangler.jsonc`. */
export default {
  /**
   * Starts the daily deploy when a cron of the Worker fires in its window, and logs what it did.
   * @param {ScheduledController} [controller] - Event of the cron.
   * @param {Record<string, unknown>} [env] - Bindings of the Worker, its secrets among them.
   * @returns {Promise<void>}
   * @throws {Error} When {@link triggerDailyDeploy} cannot start the run.
   */
  async scheduled(controller, env) {
    const outcome = await triggerDailyDeploy({
      date: new Date(controller?.scheduledTime ?? Number.NaN),
      token: env?.[DISPATCH_TOKEN_SECRET],
    });
    console.log(outcome);
  },
};
