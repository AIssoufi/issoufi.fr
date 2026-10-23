import {
  fetchReleasePullRequest,
  findReleasePullRequest,
  mergePullRequest,
} from './release-pull-request.mjs';
import {
  BRANCH,
  MERGE_SHA,
  PULL_REQUEST_URL,
  REPOSITORY,
  SHA,
  stubGitHub,
  stubGitHubEnv,
} from './testUtils.js';

const PULLS_API_URL = `https://api.github.com/repos/${REPOSITORY}/pulls`;

/** An open pull request of the REST API answer, by default the release pull request. */
const apiPullRequest = ({ head = {}, ...fields } = {}) => ({
  number: 162,
  html_url: PULL_REQUEST_URL,
  labels: [{ name: 'autorelease: pending' }],
  ...fields,
  head: { ref: BRANCH, sha: SHA, repo: { full_name: REPOSITORY }, ...head },
});

/** The release pull request as findReleasePullRequest returns it. */
const releasePullRequest = { number: 162, branch: BRANCH, sha: SHA, url: PULL_REQUEST_URL };

describe('findReleasePullRequest', () => {
  it('finds the release pull request among the open ones', () => {
    const pullRequests = [
      apiPullRequest({ number: 170, labels: [], head: { ref: 'ISF-160' } }),
      apiPullRequest({ labels: [{ name: 'ci' }, { name: 'autorelease: pending' }] }),
    ];
    expect(findReleasePullRequest({ pullRequests, repository: REPOSITORY })).toEqual(
      releasePullRequest,
    );
  });

  it('takes the first release pull request when there are several', () => {
    const pullRequests = [apiPullRequest(), apiPullRequest({ number: 163 })];
    expect(findReleasePullRequest({ pullRequests, repository: REPOSITORY })?.number).toBe(162);
  });

  it('skips a match it cannot read for a readable one', () => {
    const pullRequests = [apiPullRequest({ number: 0 }), apiPullRequest()];
    expect(findReleasePullRequest({ pullRequests, repository: REPOSITORY })).toEqual(
      releasePullRequest,
    );
  });

  it.each([
    ['without the label', { labels: [] }],
    ['once released', { labels: [{ name: 'autorelease: tagged' }] }],
    ['with labels that are not a list', { labels: 'autorelease: pending' }],
    ['with labels that are not objects', { labels: [null, 'autorelease: pending'] }],
    ['from another branch', { head: { ref: 'ISF-160' } }],
    [
      'from the release branch of main',
      { head: { ref: 'release-please--branches--main--components--a' } },
    ],
    ['without a branch', { head: { ref: undefined } }],
    ['from a fork', { head: { repo: { full_name: 'someone/issoufi.fr' } } }],
    ['from a deleted fork', { head: { repo: null } }],
    ['without a number', { number: undefined }],
    ['with a decimal number', { number: 1.5 }],
    ['with a short SHA', { head: { sha: '58ff9ea' } }],
    ['without a page', { html_url: undefined }],
  ])('ignores a pull request %s', (_, fields) => {
    const pullRequests = [apiPullRequest(fields)];
    expect(findReleasePullRequest({ pullRequests, repository: REPOSITORY })).toBeUndefined();
  });

  it.each([undefined, null, '', {}, [], [null], ['pull request'], [{ head: null }]])(
    'returns undefined for the list %o',
    pullRequests => {
      expect(findReleasePullRequest({ pullRequests, repository: REPOSITORY })).toBeUndefined();
    },
  );

  it.each([undefined, '', 42])('returns undefined for the repository %o', repository => {
    expect(
      findReleasePullRequest({ pullRequests: [apiPullRequest()], repository }),
    ).toBeUndefined();
  });
});

describe('the API calls on pull requests', () => {
  beforeEach(() => {
    stubGitHubEnv();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('fetchReleasePullRequest', () => {
    it('lists the open pull requests into develop and finds the release one', async () => {
      const requests = stubGitHub({ 'GET /pulls': [{ body: [apiPullRequest()] }] });
      await expect(fetchReleasePullRequest()).resolves.toEqual(releasePullRequest);
      expect(requests[0].url).toBe(`${PULLS_API_URL}?state=open&base=develop&per_page=100`);
    });

    it('checks the head against another repository', async () => {
      const requests = stubGitHub({
        'GET /repos/owner/repo/pulls': [
          { body: [apiPullRequest({ head: { repo: { full_name: 'owner/repo' } } })] },
        ],
      });
      await expect(fetchReleasePullRequest({ repository: 'owner/repo' })).resolves.toEqual(
        releasePullRequest,
      );
      expect(requests[0].url).toContain('/repos/owner/repo/pulls?');
    });

    it('resolves to undefined when no release pull request is open', async () => {
      stubGitHub({ 'GET /pulls': [{ body: [] }] });
      await expect(fetchReleasePullRequest()).resolves.toBeUndefined();
    });

    it('throws when the API answers an error', async () => {
      stubGitHub({
        'GET /pulls': [
          { status: 403, body: { message: 'Resource not accessible by integration' } },
        ],
      });
      await expect(fetchReleasePullRequest()).rejects.toThrow(
        'The GitHub API answered 403 to https://api.github.com/repos/AIssoufi/issoufi.fr/pulls?',
      );
    });
  });

  describe('mergePullRequest', () => {
    it('merges the tested head with a merge commit', async () => {
      const requests = stubGitHub({
        'PUT /pulls/162/merge': [{ body: { sha: MERGE_SHA, merged: true, message: 'Merged' } }],
      });
      await expect(mergePullRequest({ number: 162, sha: SHA })).resolves.toBe(MERGE_SHA);
      const [{ route, url, body }] = requests;
      expect(url).toBe(`${PULLS_API_URL}/162/merge`);
      expect(route).toBe('PUT /pulls/162/merge');
      expect(body).toEqual({ sha: SHA, merge_method: 'merge' });
    });

    it.each([{}, { sha: '58ff9ea' }, null])(
      'resolves to undefined when the answer %o gives no merge commit',
      async body => {
        stubGitHub({ 'PUT /pulls/162/merge': [{ body }] });
        await expect(mergePullRequest({ number: 162, sha: SHA })).resolves.toBeUndefined();
      },
    );

    it('throws when GitHub refuses the merge', async () => {
      stubGitHub({
        'PUT /pulls/162/merge': [
          {
            status: 409,
            body: { message: 'Head branch was modified. Review and try the merge again.' },
          },
        ],
      });
      await expect(mergePullRequest({ number: 162, sha: SHA })).rejects.toThrow(
        `The GitHub API answered 409 to ${PULLS_API_URL}/162/merge: Head branch was modified.`,
      );
    });

    it.each([
      [{ number: 162, sha: '58ff9ea' }, '"162" at "58ff9ea"'],
      [{ number: 0, sha: SHA }, `"0" at "${SHA}"`],
      [{ number: -1, sha: SHA }, `"-1" at "${SHA}"`],
      [{ number: '162', sha: SHA }, `"162" at "${SHA}"`],
      [{}, '"" at ""'],
    ])('throws without asking the API for %o', async (params, details) => {
      const requests = stubGitHub({ 'PUT /pulls/162/merge': [{ body: { sha: MERGE_SHA } }] });
      await expect(mergePullRequest(params)).rejects.toThrow(
        `Cannot merge the pull request ${details}`,
      );
      expect(requests).toEqual([]);
    });
  });
});
