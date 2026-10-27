import {
  isFinishedRun,
  isHeldRun,
  isRunningRun,
  readLatestRun,
  readRun,
  readRuns,
} from './run-reading.mjs';
import { CREATED_AT, SHA } from './testUtils.js';

const RUN_URL = 'https://github.com/AIssoufi/issoufi.fr/actions/runs/123';

/** A run of the REST API answer, as GitHub writes it. */
const apiRun = (fields = {}) => ({
  id: 123,
  head_sha: SHA,
  status: 'completed',
  conclusion: 'success',
  created_at: CREATED_AT,
  html_url: RUN_URL,
  ...fields,
});

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

describe('readRun', () => {
  it('reads a run of the API', () => {
    expect(readRun(apiRun())).toEqual(run());
  });

  it('reads a run that has not finished, without a conclusion', () => {
    expect(readRun(apiRun({ status: 'queued', conclusion: null }))).toEqual(
      run({ status: 'queued', conclusion: null }),
    );
  });

  it.each(['Scheduled deploy to production', ''])('reads the title %o of the run', title => {
    expect(readRun(apiRun({ display_title: title }))).toEqual(run({ title }));
  });

  it.each([undefined, null, 42, { text: 'Deploy' }])('leaves out the title %o', title => {
    const result = readRun(apiRun({ display_title: title }));
    expect(result).toEqual(run());
    expect(result).not.toHaveProperty('title');
  });

  it.each([
    undefined,
    null,
    'run',
    42,
    [],
    {},
    apiRun({ id: undefined }),
    apiRun({ id: 0 }),
    apiRun({ id: '123' }),
    apiRun({ head_sha: undefined }),
    apiRun({ head_sha: '58ff9ea' }),
    apiRun({ status: undefined }),
    apiRun({ conclusion: undefined }),
    apiRun({ created_at: undefined }),
    apiRun({ created_at: 'yesterday' }),
    apiRun({ created_at: 1_760_850_000_000 }),
    apiRun({ html_url: null }),
  ])('returns undefined for %o', value => {
    expect(readRun(value)).toBeUndefined();
  });
});

describe('isHeldRun', () => {
  it('spots a run that waits for approval', () => {
    expect(isHeldRun(run({ conclusion: 'action_required' }))).toBe(true);
  });

  it.each([
    run(),
    run({ conclusion: 'failure' }),
    run({ status: 'queued', conclusion: null }),
    run({ status: 'waiting', conclusion: 'action_required' }),
    undefined,
    null,
  ])('leaves out %o', value => {
    expect(isHeldRun(value)).toBe(false);
  });
});

describe('isFinishedRun', () => {
  it.each(['success', 'failure', 'cancelled', null])(
    'spots a run completed with %o',
    conclusion => {
      expect(isFinishedRun(run({ conclusion }))).toBe(true);
    },
  );

  it.each([
    run({ conclusion: 'action_required' }),
    run({ status: 'in_progress', conclusion: null }),
    run({ status: 'queued', conclusion: null }),
    undefined,
    null,
  ])('leaves out %o', value => {
    expect(isFinishedRun(value)).toBe(false);
  });
});

describe('isRunningRun', () => {
  it.each(['queued', 'in_progress', 'waiting', 'pending', 'requested'])(
    'spots a %s run',
    status => {
      expect(isRunningRun(run({ status, conclusion: null }))).toBe(true);
    },
  );

  it.each(['success', 'failure', 'action_required', null])(
    'leaves out a run completed with %o',
    conclusion => {
      expect(isRunningRun(run({ conclusion }))).toBe(false);
    },
  );

  it('returns false without a run', () => {
    expect(isRunningRun(undefined)).toBe(false);
  });
});

describe('readLatestRun', () => {
  it('reads the first run of the list', () => {
    const response = { total_count: 2, workflow_runs: [apiRun(), apiRun({ id: 122 })] };
    expect(readLatestRun(response)).toEqual(run());
  });

  it('reads a run that has not finished, without a conclusion', () => {
    const response = { workflow_runs: [apiRun({ status: 'in_progress', conclusion: null })] };
    expect(readLatestRun(response)).toEqual(run({ status: 'in_progress', conclusion: null }));
  });

  it.each([
    undefined,
    null,
    'runs',
    {},
    { workflow_runs: null },
    { workflow_runs: {} },
    { workflow_runs: [] },
    { workflow_runs: [null] },
    { workflow_runs: ['run'] },
    { workflow_runs: [apiRun({ head_sha: undefined })] },
    { workflow_runs: [apiRun({ head_sha: '58ff9ea' })] },
    { workflow_runs: [apiRun({ status: undefined })] },
    { workflow_runs: [apiRun({ status: 1 })] },
    { workflow_runs: [apiRun({ conclusion: undefined })] },
    { workflow_runs: [apiRun({ conclusion: false })] },
    { workflow_runs: [apiRun({ html_url: undefined })] },
  ])('returns undefined for %o', response => {
    expect(readLatestRun(response)).toBeUndefined();
  });
});

describe('readRuns', () => {
  it('reads every run of the list, in its order', () => {
    const response = { workflow_runs: [apiRun(), apiRun({ id: 122, conclusion: 'failure' })] };
    expect(readRuns(response)).toEqual([run(), run({ id: 122, conclusion: 'failure' })]);
  });

  it('leaves out the runs it cannot read', () => {
    const response = { workflow_runs: [null, apiRun({ id: 0 }), apiRun(), 'run'] };
    expect(readRuns(response)).toEqual([run()]);
  });

  it.each([undefined, null, 'runs', {}, { workflow_runs: null }, { workflow_runs: {} }])(
    'returns an empty list for %o',
    response => {
      expect(readRuns(response)).toEqual([]);
    },
  );
});
