import { describeRunOutcome, getCiVerdict } from './run-outcome.mjs';
import { OTHER_SHA, RUNS_URL, SHA, workflowRun } from './testUtils.js';

describe('describeRunOutcome', () => {
  it('says that a completed run passed', () => {
    expect(describeRunOutcome(workflowRun())).toEqual({
      isSuccess: true,
      outcome: `passed on 58ff9ea: ${RUNS_URL}/501`,
    });
  });

  it.each(['queued', 'in_progress', 'waiting'])('says that a %s run is still running', status => {
    expect(describeRunOutcome(workflowRun({ status, conclusion: null }))).toEqual({
      isSuccess: false,
      outcome: `is still running on 58ff9ea (${status}): ${RUNS_URL}/501`,
    });
  });

  it.each(['failure', 'cancelled', 'timed_out', 'skipped'])(
    'says that a run ended with %s did not pass',
    conclusion => {
      expect(describeRunOutcome(workflowRun({ conclusion }))).toEqual({
        isSuccess: false,
        outcome: `did not pass on 58ff9ea (${conclusion}): ${RUNS_URL}/501`,
      });
    },
  );

  it('says that a held run waits for approval', () => {
    expect(describeRunOutcome(workflowRun({ conclusion: 'action_required' }))).toEqual({
      isSuccess: false,
      outcome: `is waiting for someone to approve it on 58ff9ea: ${RUNS_URL}/501`,
    });
  });

  it('names a missing conclusion', () => {
    expect(describeRunOutcome(workflowRun({ conclusion: null })).outcome).toBe(
      `did not pass on 58ff9ea (no conclusion): ${RUNS_URL}/501`,
    );
  });

  it.each([undefined, null])('says that a missing run (%o) could not be read', missingRun => {
    expect(describeRunOutcome(missingRun)).toEqual({
      isSuccess: false,
      outcome: 'could not be read.',
    });
  });
});

describe('getCiVerdict', () => {
  /** Start of the message of a deploy that stops. */
  const STOPPED = 'Nothing deployed: a later scheduled run tries again, since';

  it('lets a commit whose run passed through', () => {
    expect(getCiVerdict({ run: workflowRun(), sha: SHA, branch: 'develop' })).toEqual({
      isTested: true,
      level: 'notice',
      message: `The CI of develop passed on 58ff9ea: ${RUNS_URL}/501`,
    });
  });

  it('names develop by default', () => {
    expect(getCiVerdict({ run: workflowRun(), sha: SHA }).message).toBe(
      `The CI of develop passed on 58ff9ea: ${RUNS_URL}/501`,
    );
  });

  it('names another branch', () => {
    expect(
      getCiVerdict({ run: workflowRun({ conclusion: 'failure' }), sha: SHA, branch: 'main' }),
    ).toEqual({
      isTested: false,
      level: 'warning',
      message: `${STOPPED} the CI of main did not pass on 58ff9ea (failure): ${RUNS_URL}/501`,
    });
  });

  it.each(['queued', 'in_progress', 'waiting', 'pending', 'requested'])(
    'stops with a notice while the run is %s',
    status => {
      expect(getCiVerdict({ run: workflowRun({ status, conclusion: null }), sha: SHA })).toEqual({
        isTested: false,
        level: 'notice',
        message: `${STOPPED} the CI of develop is still running on 58ff9ea (${status}): ${RUNS_URL}/501`,
      });
    },
  );

  it.each(['failure', 'cancelled', 'timed_out', 'skipped', 'startup_failure', 'neutral'])(
    'stops with a warning when the run ended with %s',
    conclusion => {
      expect(getCiVerdict({ run: workflowRun({ conclusion }), sha: SHA })).toEqual({
        isTested: false,
        level: 'warning',
        message: `${STOPPED} the CI of develop did not pass on 58ff9ea (${conclusion}): ${RUNS_URL}/501`,
      });
    },
  );

  it('stops with a warning while the run waits for approval', () => {
    expect(getCiVerdict({ run: workflowRun({ conclusion: 'action_required' }), sha: SHA })).toEqual(
      {
        isTested: false,
        level: 'warning',
        message: `${STOPPED} the CI of develop is waiting for someone to approve it on 58ff9ea: ${RUNS_URL}/501`,
      },
    );
  });

  it('stops with a warning when a completed run has no conclusion', () => {
    expect(getCiVerdict({ run: workflowRun({ conclusion: null }), sha: SHA })).toEqual({
      isTested: false,
      level: 'warning',
      message: `${STOPPED} the CI of develop did not pass on 58ff9ea (no conclusion): ${RUNS_URL}/501`,
    });
  });

  it.each([undefined, null])('stops with a notice when the commit has no run (%o)', missingRun => {
    expect(getCiVerdict({ run: missingRun, sha: SHA })).toEqual({
      isTested: false,
      level: 'notice',
      message: `${STOPPED} the CI has not run on develop for 58ff9ea.`,
    });
  });

  it('stops with a notice when the run tested another commit', () => {
    expect(getCiVerdict({ run: workflowRun({ sha: OTHER_SHA }), sha: SHA })).toEqual({
      isTested: false,
      level: 'notice',
      message: `${STOPPED} the CI has not run on develop for 58ff9ea.`,
    });
  });

  it.each([undefined, '', '58ff9ea', SHA.toUpperCase()])('stops for the commit %o', sha => {
    const verdict = getCiVerdict({ run: workflowRun(), sha });
    expect(verdict.isTested).toBe(false);
    expect(verdict.level).toBe('notice');
    expect(verdict.message.startsWith(`${STOPPED} the CI has not run on develop for `)).toBe(true);
  });

  it('names a missing commit', () => {
    expect(getCiVerdict({ run: workflowRun() }).message).toBe(
      `${STOPPED} the CI has not run on develop for this commit.`,
    );
  });
});
