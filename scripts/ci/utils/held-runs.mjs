// @ts-check
import {
  CI_WORKFLOW_FILE,
  PULL_REQUEST_EVENT,
  PULL_REQUEST_WORKFLOW_FILES,
} from '../constants.mjs';
import { getErrorMessage } from './errors.mjs';
import { isHeldRun } from './run-reading.mjs';
import { approveRun, fetchLatestRun } from './run-requests.mjs';

/**
 * Tells whether a workflow of the release pull request is the CI, whose run the daily release
 * already found, rather than another one that it looks up.
 * @param {string} workflow - File name of the workflow, from {@link PULL_REQUEST_WORKFLOW_FILES}.
 * @returns {boolean} True for {@link CI_WORKFLOW_FILE}.
 */
const isCiWorkflow = workflow => workflow === CI_WORKFLOW_FILE;

/**
 * Names the run of a workflow of the release pull request in a message.
 * @param {string} workflow - File name of the workflow, from {@link PULL_REQUEST_WORKFLOW_FILES}.
 * @returns {string} `the CI` for {@link CI_WORKFLOW_FILE}, `the <file> run` for another workflow.
 * @example
 * nameRun('pull-request-title.yml'); // 'the pull-request-title.yml run'
 */
export const nameRun = workflow => (isCiWorkflow(workflow) ? 'the CI' : `the ${workflow} run`);

/**
 * Approves a run that GitHub holds, as it does for the pull request runs of a pull request that
 * GitHub Actions opened.
 * @param {number} runId - Identifier of the held run.
 * @returns {Promise<string | undefined>} `undefined` once approved, or why GitHub refused.
 */
const approveHeldRun = async runId => {
  try {
    await approveRun({ runId });
    return undefined;
  } catch (error) {
    return getErrorMessage(error);
  }
};

/**
 * A held run of the release pull request that GitHub refused to let the daily release approve.
 * @typedef {object} RefusedApproval
 * @property {string} workflow - File name of the workflow of the run.
 * @property {import('./run-reading.mjs').WorkflowRun} run - The held run.
 * @property {string} reason - Why GitHub refused, from {@link approveHeldRun}.
 */

/**
 * Parameters of {@link approveHeldRuns}.
 * @typedef {object} ApproveHeldRunsParams
 * @property {string} name - The release pull request, as messages name it.
 * @property {string} branch - Branch of the release pull request.
 * @property {import('./run-reading.mjs').WorkflowRun} ciRun - The run of the CI that its pull
 * request event started on its head, which GitHub holds.
 */

/**
 * Approves the runs that GitHub holds on the head of the release pull request, in the order of
 * {@link PULL_REQUEST_WORKFLOW_FILES}: the run of the CI, and the latest pull request run of each
 * other workflow on that head, which GitHub holds along with it. A workflow without a run on that
 * head, or whose run GitHub does not hold, is left alone. It stops at the first run that GitHub
 * refuses to let it approve.
 * @param {ApproveHeldRunsParams} params
 * @returns {Promise<RefusedApproval | undefined>} `undefined` once every held run is approved, or
 * the run that GitHub refused to approve.
 * @throws {Error} When the runs of another workflow cannot be listed.
 */
export const approveHeldRuns = async ({ name, branch, ciRun }) => {
  for (const workflow of PULL_REQUEST_WORKFLOW_FILES) {
    const run = isCiWorkflow(workflow)
      ? ciRun
      : await fetchLatestRun({ workflow, branch, event: PULL_REQUEST_EVENT, sha: ciRun.sha });
    const isHeld = run !== undefined && isHeldRun(run);
    if (!isHeld) continue;

    const reason = await approveHeldRun(run.id);
    if (reason !== undefined) return { workflow, run, reason };
    console.log(`Approved ${nameRun(workflow)} of ${name}, which GitHub held: ${run.url}`);
  }
  return undefined;
};
