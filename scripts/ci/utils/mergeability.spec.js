import {
  describeMergeBlock,
  describeUnpassedChecks,
  fetchPullRequestState,
  fetchUnpassedChecks,
  findUnpassedChecks,
  isMergeableState,
  readCheckRuns,
  readPullRequestState,
  readRequiredChecks,
  waitForMergeable,
} from './mergeability.mjs';
import { stubGitHub, stubGitHubEnv } from './testUtils.js';

const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';
const OTHER_SHA = '9ff31f7aa1b2c3d4e5f60718293a4b5c6d7e8f90';
const REPOSITORY_API_URL = 'https://api.github.com/repos/AIssoufi/issoufi.fr';

/** A pull request of the REST API answer, by default mergeable. */
const apiPullRequest = ({ sha = SHA, mergeableState = 'clean' } = {}) => ({
  number: 162,
  head: { ref: 'release-please--branches--develop--components--issoufi-v3', sha },
  mergeable_state: mergeableState,
});

/** A rule of the REST API answer that requires the given status checks. */
const requiredChecksRule = (...contexts) => ({
  type: 'required_status_checks',
  parameters: {
    strict_required_status_checks_policy: false,
    required_status_checks: contexts.map(context => ({ context, integration_id: 15368 })),
  },
});

/** A check run, as readCheckRuns returns it, by default passed. */
const checkRun = ({ name, status = 'completed', conclusion = 'success' }) => ({
  name,
  status,
  conclusion,
});

describe('readPullRequestState', () => {
  it('reads the head commit and the mergeable state', () => {
    expect(readPullRequestState(apiPullRequest({ mergeableState: 'blocked' }))).toEqual({
      sha: SHA,
      mergeableState: 'blocked',
    });
  });

  it.each([
    undefined,
    null,
    'pull request',
    {},
    { head: null, mergeable_state: 'clean' },
    { head: { sha: '58ff9ea' }, mergeable_state: 'clean' },
    { head: { sha: SHA } },
    { head: { sha: SHA }, mergeable_state: '' },
    { head: { sha: SHA }, mergeable_state: null },
  ])('returns undefined for %o', value => {
    expect(readPullRequestState(value)).toBeUndefined();
  });
});

describe('isMergeableState', () => {
  it.each(['clean', 'unstable', 'has_hooks'])('lets a %s pull request merge', state => {
    expect(isMergeableState(state)).toBe(true);
  });

  it.each(['blocked', 'behind', 'dirty', 'draft', 'unknown', 'CLEAN', '', undefined, null, 1])(
    'stops a pull request whose state is %o',
    state => {
      expect(isMergeableState(state)).toBe(false);
    },
  );
});

describe('readRequiredChecks', () => {
  it('reads the checks that the rules of a branch require', () => {
    const rules = [
      { type: 'deletion', parameters: null },
      requiredChecksRule('format', 'lint'),
      { type: 'pull_request', parameters: { required_approving_review_count: 0 } },
      requiredChecksRule('lint', 'build'),
    ];
    expect(readRequiredChecks(rules)).toEqual(['format', 'lint', 'build']);
  });

  it('leaves out the checks it cannot read', () => {
    const rule = requiredChecksRule('format');
    rule.parameters.required_status_checks.push(null, { context: '' }, { context: 42 }, {});
    expect(readRequiredChecks([rule, null, { type: 'required_status_checks' }])).toEqual([
      'format',
    ]);
  });

  it.each([
    undefined,
    null,
    {},
    [],
    [{ type: 'deletion' }],
    [{ type: 'required_status_checks', parameters: { required_status_checks: 'lint' } }],
  ])('returns an empty list for %o', rules => {
    expect(readRequiredChecks(rules)).toEqual([]);
  });
});

describe('readCheckRuns', () => {
  it('reads the name, status and conclusion of each check run', () => {
    const response = {
      total_count: 2,
      check_runs: [
        { id: 1, name: 'lint', status: 'completed', conclusion: 'success', app: { id: 15368 } },
        { id: 2, name: 'build', status: 'in_progress', conclusion: null },
      ],
    };
    expect(readCheckRuns(response)).toEqual([
      checkRun({ name: 'lint' }),
      checkRun({ name: 'build', status: 'in_progress', conclusion: null }),
    ]);
  });

  it('leaves out the check runs it cannot read, and reads a missing conclusion as null', () => {
    const response = {
      check_runs: [
        null,
        { name: 'lint' },
        { status: 'completed' },
        { name: 'build', status: 'queued' },
      ],
    };
    expect(readCheckRuns(response)).toEqual([
      checkRun({ name: 'build', status: 'queued', conclusion: null }),
    ]);
  });

  it.each([42, {}, false, ''])('reads a conclusion that names none (%o) as null', conclusion => {
    const response = { check_runs: [{ name: 'lint', status: 'completed', conclusion }] };
    expect(readCheckRuns(response)).toEqual([
      checkRun({ name: 'lint', status: 'completed', conclusion: null }),
    ]);
  });

  it.each([undefined, null, {}, { check_runs: null }, { check_runs: {} }])(
    'returns an empty list for %o',
    response => {
      expect(readCheckRuns(response)).toEqual([]);
    },
  );
});

describe('findUnpassedChecks', () => {
  it('names the required checks that did not pass, and why', () => {
    const checkRuns = [
      checkRun({ name: 'lint' }),
      checkRun({ name: 'build', status: 'in_progress', conclusion: null }),
      checkRun({ name: 'test', conclusion: 'failure' }),
      checkRun({ name: 'commits', conclusion: null }),
      checkRun({ name: 'Cloudflare Pages', conclusion: 'failure' }),
    ];
    expect(
      findUnpassedChecks({
        requiredChecks: ['format', 'lint', 'build', 'test', 'commits'],
        checkRuns,
      }),
    ).toEqual([
      'format (missing)',
      'build (in_progress)',
      'test (failure)',
      'commits (no conclusion)',
    ]);
  });

  it.each(['success', 'neutral', 'skipped'])('accepts a check that ended with %s', conclusion => {
    expect(
      findUnpassedChecks({
        requiredChecks: ['lint'],
        checkRuns: [checkRun({ name: 'lint', conclusion })],
      }),
    ).toEqual([]);
  });

  it('accepts a check that passed in one of its runs', () => {
    const checkRuns = [
      checkRun({ name: 'lint', conclusion: 'failure' }),
      checkRun({ name: 'lint' }),
    ];
    expect(findUnpassedChecks({ requiredChecks: ['lint'], checkRuns })).toEqual([]);
  });

  it('names the first run of a check that never passed', () => {
    const checkRuns = [
      checkRun({ name: 'lint', conclusion: 'cancelled' }),
      checkRun({ name: 'lint', conclusion: 'failure' }),
    ];
    expect(findUnpassedChecks({ requiredChecks: ['lint'], checkRuns })).toEqual([
      'lint (cancelled)',
    ]);
  });

  it('returns an empty list without any required check', () => {
    expect(findUnpassedChecks({ checkRuns: [checkRun({ name: 'lint' })] })).toEqual([]);
    expect(findUnpassedChecks({})).toEqual([]);
  });

  it('names every required check as missing without any check run', () => {
    expect(findUnpassedChecks({ requiredChecks: ['format', 'lint'] })).toEqual([
      'format (missing)',
      'lint (missing)',
    ]);
  });
});

describe('describeUnpassedChecks', () => {
  it('names the checks', () => {
    expect(describeUnpassedChecks(['format (missing)', 'lint (failure)'])).toBe(
      'the required checks format (missing), lint (failure) did not pass',
    );
  });

  it.each([[[]], [undefined]])('gives an empty text for %o', unpassedChecks => {
    expect(describeUnpassedChecks(unpassedChecks)).toBe('');
  });
});

describe('describeMergeBlock', () => {
  it('names the state and the required checks that did not pass', () => {
    expect(
      describeMergeBlock({ mergeableState: 'blocked', unpassedChecks: ['format (missing)'] }),
    ).toBe(
      'is blocked by a rule of the base branch (blocked): the required checks format (missing) did not pass',
    );
  });

  it.each([
    ['blocked', 'is blocked by a rule of the base branch (blocked)'],
    ['behind', 'is behind its base branch, which a rule requires to be up to date (behind)'],
    ['dirty', 'conflicts with its base branch (dirty)'],
    ['draft', 'is a draft (draft)'],
    ['unknown', 'has not been checked by GitHub yet (unknown)'],
    ['odd', 'cannot merge (odd)'],
    [undefined, 'could not be read'],
    ['', 'could not be read'],
  ])('says why a %o pull request cannot merge', (mergeableState, reason) => {
    expect(describeMergeBlock({ mergeableState, unpassedChecks: [] })).toBe(reason);
    expect(describeMergeBlock({ mergeableState })).toBe(reason);
  });
});

describe('the API calls on pull requests', () => {
  /** Answers the reads of the pull request #162 in turn, then repeats the last answer. */
  const stubPullRequest = (...answers) => stubGitHub({ 'GET /pulls/162': answers });

  beforeEach(() => {
    stubGitHubEnv();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('fetchPullRequestState', () => {
    it('reads whether a pull request can merge', async () => {
      const requests = stubPullRequest({ body: apiPullRequest({ mergeableState: 'unknown' }) });
      await expect(fetchPullRequestState({ number: 162 })).resolves.toEqual({
        sha: SHA,
        mergeableState: 'unknown',
      });
      expect(requests[0].url).toBe(`${REPOSITORY_API_URL}/pulls/162`);
    });

    it.each([undefined, 0, 1.5, '162'])(
      'throws without asking the API for the pull request %o',
      async number => {
        const requests = stubPullRequest({ body: apiPullRequest() });
        await expect(fetchPullRequestState({ number })).rejects.toThrow('Invalid pull request');
        expect(requests).toEqual([]);
      },
    );
  });

  describe('waitForMergeable', () => {
    it('reads the pull request until it can merge', async () => {
      const requests = stubPullRequest(
        { body: apiPullRequest({ mergeableState: 'unknown' }) },
        { body: apiPullRequest({ mergeableState: 'blocked' }) },
        { body: apiPullRequest({ mergeableState: 'clean' }) },
      );
      await expect(waitForMergeable({ number: 162, sha: SHA, delayMs: 0 })).resolves.toEqual({
        sha: SHA,
        mergeableState: 'clean',
      });
      expect(requests).toHaveLength(3);
    });

    it('gives the state as last read when it never can merge', async () => {
      const requests = stubPullRequest({ body: apiPullRequest({ mergeableState: 'blocked' }) });
      await expect(
        waitForMergeable({ number: 162, sha: SHA, attempts: 3, delayMs: 0 }),
      ).resolves.toEqual({ sha: SHA, mergeableState: 'blocked' });
      expect(requests).toHaveLength(3);
    });

    it('stops at once when the head moved from the tested commit', async () => {
      const requests = stubPullRequest({
        body: apiPullRequest({ sha: OTHER_SHA, mergeableState: 'blocked' }),
      });
      await expect(waitForMergeable({ number: 162, sha: SHA, delayMs: 0 })).resolves.toEqual({
        sha: OTHER_SHA,
        mergeableState: 'blocked',
      });
      expect(requests).toHaveLength(1);
    });

    it('waits between two reads', async () => {
      vi.useFakeTimers();
      const requests = stubPullRequest(
        { body: apiPullRequest({ mergeableState: 'blocked' }) },
        { body: apiPullRequest() },
      );
      const promise = waitForMergeable({ number: 162, sha: SHA });
      await vi.advanceTimersByTimeAsync(9_999);
      expect(requests).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      await expect(promise).resolves.toEqual({ sha: SHA, mergeableState: 'clean' });
    });

    it('tries a failed read again', async () => {
      stubPullRequest({ status: 502, body: {} }, { body: apiPullRequest() });
      await expect(waitForMergeable({ number: 162, sha: SHA, delayMs: 0 })).resolves.toEqual({
        sha: SHA,
        mergeableState: 'clean',
      });
    });

    it('resolves to undefined when the pull request can never be read, or for no attempt', async () => {
      const requests = stubPullRequest({ body: {} });
      await expect(
        waitForMergeable({ number: 162, sha: SHA, attempts: 2, delayMs: 0 }),
      ).resolves.toBeUndefined();
      await expect(
        waitForMergeable({ number: 162, sha: SHA, attempts: 0, delayMs: 0 }),
      ).resolves.toBeUndefined();
      expect(requests).toHaveLength(2);
    });

    it('throws the error of the last read when every read failed', async () => {
      stubPullRequest({ status: 500, body: {} });
      await expect(
        waitForMergeable({ number: 162, sha: SHA, attempts: 2, delayMs: 0 }),
      ).rejects.toThrow('The GitHub API answered 500');
    });

    it.each([undefined, 0, '162'])(
      'throws at once without asking the API for the pull request %o',
      async number => {
        const requests = stubPullRequest({ body: apiPullRequest() });
        await expect(waitForMergeable({ number, sha: SHA, delayMs: 0 })).rejects.toThrow(
          'Invalid pull request',
        );
        expect(requests).toEqual([]);
      },
    );
  });

  describe('fetchUnpassedChecks', () => {
    /** Answers the rules of develop and the check runs of the commit with the given answers. */
    const stubChecks = ({ rules, checkRuns }) =>
      stubGitHub({
        'GET /rules/branches/develop': [rules],
        [`GET /commits/${SHA}/check-runs`]: [checkRuns],
      });

    it('names the required checks of the branch that the commit has not passed', async () => {
      const requests = stubChecks({
        rules: { body: [requiredChecksRule('format', 'lint', 'build')] },
        checkRuns: {
          body: {
            check_runs: [
              { name: 'lint', status: 'completed', conclusion: 'success' },
              { name: 'build', status: 'completed', conclusion: 'failure' },
            ],
          },
        },
      });
      await expect(fetchUnpassedChecks({ branch: 'develop', sha: SHA })).resolves.toEqual([
        'format (missing)',
        'build (failure)',
      ]);
      const urls = requests.map(({ url }) => url).sort();
      expect(urls).toEqual([
        `${REPOSITORY_API_URL}/commits/${SHA}/check-runs?per_page=100`,
        `${REPOSITORY_API_URL}/rules/branches/develop`,
      ]);
    });

    it('throws when the API answers with an error', async () => {
      stubChecks({ rules: { status: 403, body: {} }, checkRuns: { status: 403, body: {} } });
      await expect(fetchUnpassedChecks({ branch: 'develop', sha: SHA })).rejects.toThrow(
        'The GitHub API answered 403',
      );
    });

    it.each([
      [{ branch: 'develop', sha: '58ff9ea' }, '"58ff9ea" against "develop"'],
      [{ branch: '', sha: SHA }, `"${SHA}" against ""`],
      [{}, '"" against ""'],
    ])('throws without asking the API for %o', async (params, details) => {
      const requests = stubChecks({ rules: { body: [] }, checkRuns: { body: { check_runs: [] } } });
      await expect(fetchUnpassedChecks(params)).rejects.toThrow(
        `Cannot read the checks of ${details}`,
      );
      expect(requests).toEqual([]);
    });
  });
});
