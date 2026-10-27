// @ts-check
import { DEVELOP_BRANCH, RUN_COMPLETED_STATUS, RUN_SUCCESS_CONCLUSION } from '../constants.mjs';
import { isCommitSha, shortenSha } from './commit-sha.mjs';
import { isHeldRun, isRunningRun } from './run-reading.mjs';

/** @import { readLatestRun, readRun } from './run-reading.mjs' */
/** @typedef {import('./run-reading.mjs').WorkflowRun} WorkflowRun */

/**
 * How a run ended, from {@link describeRunOutcome}.
 * @typedef {object} RunOutcome
 * @property {boolean} isSuccess - Whether the run finished with a success.
 * @property {string} outcome - What happened, as the end of a sentence about the run, such as
 * `the CI of develop passed on 58ff9ea: <page of the run>`.
 */

/**
 * Tells how a run of a workflow ended, for a message about it: passed, still running, waiting for
 * approval, or did not pass. A run still in progress, held, failed, cancelled or timed out does
 * not count as a success.
 * @param {WorkflowRun | undefined} run - The run, from {@link readRun}.
 * @returns {RunOutcome} Whether the run passed, and the end of a sentence that says what
 * happened: `passed on <commit>: <page>`, `is still running on <commit> (<status>): <page>`,
 * `is waiting for someone to approve it on <commit>: <page>`,
 * `did not pass on <commit> (<conclusion>): <page>`, or `could not be read.` without a run.
 * @example
 * `The CI of develop ${describeRunOutcome(run).outcome}`;
 * // 'The CI of develop is still running on 58ff9ea (in_progress): https://github.com/…'
 */
export const describeRunOutcome = run => {
  if (!run) return { isSuccess: false, outcome: 'could not be read.' };

  const commit = shortenSha(run.sha);
  if (isHeldRun(run)) {
    return {
      isSuccess: false,
      outcome: `is waiting for someone to approve it on ${commit}: ${run.url}`,
    };
  }

  const isCompleted = run.status === RUN_COMPLETED_STATUS;
  if (!isCompleted) {
    return {
      isSuccess: false,
      outcome: `is still running on ${commit} (${run.status}): ${run.url}`,
    };
  }

  const isSuccess = run.conclusion === RUN_SUCCESS_CONCLUSION;
  if (!isSuccess) {
    return {
      isSuccess: false,
      outcome: `did not pass on ${commit} (${run.conclusion ?? 'no conclusion'}): ${run.url}`,
    };
  }

  return { isSuccess: true, outcome: `passed on ${commit}: ${run.url}` };
};

/**
 * Whether a commit can be deployed, and why, from {@link getCiVerdict}.
 * @typedef {object} CiVerdict
 * @property {boolean} isTested - Whether the CI run of the commit finished with a success.
 * @property {'notice' | 'warning'} level - Level of the annotation that says why the deploy
 * stops: `warning` when someone has to act, for a run that ended without passing or that waits
 * for approval; `notice` when the CI has not run or is still running, which a later run checks
 * again, and for a tested commit.
 * @property {string} message - Why, for the log, or for the annotation when the deploy stops.
 */

/**
 * Parameters of {@link getCiVerdict}.
 * @typedef {object} GetCiVerdictParams
 * @property {WorkflowRun} [run] - Latest run of the CI for the commit, from {@link readLatestRun}.
 * Missing when the CI has not run on that commit.
 * @property {string} [sha] - Full SHA of the commit to deploy.
 * @property {string} [branch] - Branch the run was started on, named in the message. Defaults to
 * {@link DEVELOP_BRANCH}.
 */

/**
 * Tells whether a commit passed its CI, so that only a tested commit reaches production: its
 * latest run must be completed with a success. Any other run stops the deploy, and the deploy
 * workflow fails so that a later scheduled run tries again (`check-develop-ci.mjs`).
 * @param {GetCiVerdictParams} params
 * @returns {CiVerdict} Whether the commit is tested, the level of the annotation and why. A
 * missing run, or a run of another commit, counts as untested.
 * @example
 * getCiVerdict({ run: { sha, status: 'in_progress', conclusion: null, url }, sha });
 * // { isTested: false, level: 'notice', message: 'Nothing deployed: a later scheduled run tries
 * // again, since the CI of develop is still running on 58ff9ea (in_progress): https://…' }
 */
export const getCiVerdict = ({ run, sha, branch = DEVELOP_BRANCH }) => {
  const isRunOfCommit = isCommitSha(sha) && run?.sha === sha;
  if (!isRunOfCommit) {
    return {
      isTested: false,
      level: 'notice',
      message: `Nothing deployed: a later scheduled run tries again, since the CI has not run on ${branch} for ${shortenSha(sha) || 'this commit'}.`,
    };
  }

  const { isSuccess, outcome } = describeRunOutcome(run);
  if (isSuccess) {
    return { isTested: true, level: 'notice', message: `The CI of ${branch} ${outcome}` };
  }

  // A run that ended without passing, or that GitHub holds, needs someone to act, unlike one that
  // is still going
  const needsSomeone = !isRunningRun(run);
  return {
    isTested: false,
    level: needsSomeone ? 'warning' : 'notice',
    message: `Nothing deployed: a later scheduled run tries again, since the CI of ${branch} ${outcome}`,
  };
};
