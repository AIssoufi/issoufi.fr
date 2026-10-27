import { describeRunOutcome, getCiVerdict } from './run-outcome.mjs';
import { CREATED_AT, OTHER_SHA, SHA } from './testUtils.js';

const RUN_URL = 'https://github.com/AIssoufi/issoufi.fr/actions/runs/123';

/** A run as readLatestRun returns it. */
const run = (fields = {}) => ({
  id: 123,
  sha: SHA,
  status: 'completed',
  conclusion: 'success',
  createdAt: new Date(CREATED_AT),
  url: RUN_URL,
  ...fields,
});

describe('describeRunOutcome', () => {
  it('says that a completed run passed', () => {
    expect(describeRunOutcome(run())).toEqual({
      isSuccess: true,
      outcome: `passed on 58ff9ea: ${RUN_URL}`,
    });
  });

  it.each(['queued', 'in_progress', 'waiting'])('says that a %s run is still running', status => {
    expect(describeRunOutcome(run({ status, conclusion: null }))).toEqual({
      isSuccess: false,
      outcome: `is still running on 58ff9ea (${status}): ${RUN_URL}`,
    });
  });

  it.each(['failure', 'cancelled', 'timed_out', 'skipped'])(
    'says that a run ended with %s did not pass',
    conclusion => {
      expect(describeRunOutcome(run({ conclusion }))).toEqual({
        isSuccess: false,
        outcome: `did not pass on 58ff9ea (${conclusion}): ${RUN_URL}`,
      });
    },
  );

  it('says that a held run waits for approval', () => {
    expect(describeRunOutcome(run({ conclusion: 'action_required' }))).toEqual({
      isSuccess: false,
      outcome: `is waiting for someone to approve it on 58ff9ea: ${RUN_URL}`,
    });
  });

  it('names a missing conclusion', () => {
    expect(describeRunOutcome(run({ conclusion: null })).outcome).toBe(
      `did not pass on 58ff9ea (no conclusion): ${RUN_URL}`,
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
    expect(getCiVerdict({ run: run(), sha: SHA, branch: 'develop' })).toEqual({
      isTested: true,
      level: 'notice',
      message: `The CI of develop passed on 58ff9ea: ${RUN_URL}`,
    });
  });

  it('names develop by default', () => {
    expect(getCiVerdict({ run: run(), sha: SHA }).message).toBe(
      `The CI of develop passed on 58ff9ea: ${RUN_URL}`,
    );
  });

  it('names another branch', () => {
    expect(getCiVerdict({ run: run({ conclusion: 'failure' }), sha: SHA, branch: 'main' })).toEqual(
      {
        isTested: false,
        level: 'warning',
        message: `${STOPPED} the CI of main did not pass on 58ff9ea (failure): ${RUN_URL}`,
      },
    );
  });

  it.each(['queued', 'in_progress', 'waiting', 'pending', 'requested'])(
    'stops with a notice while the run is %s',
    status => {
      expect(getCiVerdict({ run: run({ status, conclusion: null }), sha: SHA })).toEqual({
        isTested: false,
        level: 'notice',
        message: `${STOPPED} the CI of develop is still running on 58ff9ea (${status}): ${RUN_URL}`,
      });
    },
  );

  it.each(['failure', 'cancelled', 'timed_out', 'skipped', 'startup_failure', 'neutral'])(
    'stops with a warning when the run ended with %s',
    conclusion => {
      expect(getCiVerdict({ run: run({ conclusion }), sha: SHA })).toEqual({
        isTested: false,
        level: 'warning',
        message: `${STOPPED} the CI of develop did not pass on 58ff9ea (${conclusion}): ${RUN_URL}`,
      });
    },
  );

  it('stops with a warning while the run waits for approval', () => {
    expect(getCiVerdict({ run: run({ conclusion: 'action_required' }), sha: SHA })).toEqual({
      isTested: false,
      level: 'warning',
      message: `${STOPPED} the CI of develop is waiting for someone to approve it on 58ff9ea: ${RUN_URL}`,
    });
  });

  it('stops with a warning when a completed run has no conclusion', () => {
    expect(getCiVerdict({ run: run({ conclusion: null }), sha: SHA })).toEqual({
      isTested: false,
      level: 'warning',
      message: `${STOPPED} the CI of develop did not pass on 58ff9ea (no conclusion): ${RUN_URL}`,
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
    expect(getCiVerdict({ run: run({ sha: OTHER_SHA }), sha: SHA })).toEqual({
      isTested: false,
      level: 'notice',
      message: `${STOPPED} the CI has not run on develop for 58ff9ea.`,
    });
  });

  it.each([undefined, '', '58ff9ea', SHA.toUpperCase()])('stops for the commit %o', sha => {
    const verdict = getCiVerdict({ run: run(), sha });
    expect(verdict.isTested).toBe(false);
    expect(verdict.level).toBe('notice');
    expect(verdict.message.startsWith(`${STOPPED} the CI has not run on develop for `)).toBe(true);
  });

  it('names a missing commit', () => {
    expect(getCiVerdict({ run: run() }).message).toBe(
      `${STOPPED} the CI has not run on develop for this commit.`,
    );
  });
});
