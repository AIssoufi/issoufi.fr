// @ts-check
import { requestRepositoryApi } from './github-api.mjs';
import { isPositiveInteger } from './numbers.mjs';

/** @import { fetchRun } from './run-requests.mjs' */

/**
 * A run that {@link dispatchWorkflow} started.
 * @typedef {object} DispatchedRun
 * @property {number} id - Identifier of the run, to follow it with {@link fetchRun}.
 * @property {string} url - Page of the run on GitHub.
 */

/**
 * Reads the run that GitHub started from the answer of the endpoint that dispatches a workflow,
 * asked with `return_run_details`.
 * @param {unknown} response - Parsed JSON answer, `{ workflow_run_id, run_url, html_url }`.
 * @returns {DispatchedRun | undefined} The run, or `undefined` when the answer lacks a positive
 * integer identifier or the page of the run.
 * @example
 * readDispatchedRun({ workflow_run_id: 123, html_url: 'https://github.com/…/runs/123' });
 * // { id: 123, url: 'https://github.com/…/runs/123' }
 */
export const readDispatchedRun = response => {
  const { workflow_run_id: id, html_url: url } =
    /** @type {Record<string, unknown> | null | undefined} */ (response) ?? {};
  const isRun = isPositiveInteger(id) && typeof url === 'string' && url !== '';
  return isRun ? { id, url } : undefined;
};

/**
 * Parameters of {@link dispatchWorkflow}.
 * @typedef {object} DispatchWorkflowParams
 * @property {string} workflow - File name of the workflow, which must have a
 * `workflow_dispatch` trigger, e.g. `ci.yml`.
 * @property {string} ref - Branch or tag to run the workflow on, e.g. `develop`.
 * @property {Record<string, string>} [inputs] - Values of the `workflow_dispatch` inputs of the
 * workflow, by name. Left out, each input takes its default.
 * @property {string} [apiUrl] - REST API of GitHub. Defaults to the `GITHUB_API_URL` variable.
 * @property {string} [repository] - Repository as `owner/name`. Defaults to the
 * `GITHUB_REPOSITORY` variable.
 * @property {string} [token] - Token to start the run with, which needs the `actions: write`
 * permission. Defaults to the `GITHUB_TOKEN` variable.
 */

/**
 * Starts a workflow by hand on a branch, as _Run workflow_ does. Unlike the other events that the
 * `GITHUB_TOKEN` triggers, such a run starts at once, without approval.
 * @param {DispatchWorkflowParams} params
 * @returns {Promise<DispatchedRun>} The run that GitHub started.
 * @throws {Error} When the workflow or the branch is missing, when the API answers with an error
 * status, or when it does not say which run it started.
 * @example
 * await dispatchWorkflow({ workflow: 'ci.yml', ref: 'develop' }); // { id: 123, url: '…' }
 */
export const dispatchWorkflow = async ({ workflow, ref, inputs, ...api }) => {
  const hasWorkflow = typeof workflow === 'string' && workflow !== '';
  const hasRef = typeof ref === 'string' && ref !== '';
  if (!hasWorkflow || !hasRef) {
    throw new Error(`Cannot start the workflow "${workflow ?? ''}" on "${ref ?? ''}"`);
  }

  const response = await requestRepositoryApi({
    ...api,
    path: `/actions/workflows/${encodeURIComponent(workflow)}/dispatches`,
    method: 'POST',
    body: { ref, ...(inputs && { inputs }), return_run_details: true },
  });
  const run = readDispatchedRun(response);
  if (!run) throw new Error(`GitHub started ${workflow} on ${ref} without saying which run`);
  return run;
};
