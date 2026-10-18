import {
  getMainCiRunsUrl,
  getRepositoryUrl,
  parseCommitLog,
  renderDeployReport,
} from './deploy-report.mjs';

const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';
const OTHER_SHA = '9ff31f7aa1b2c3d4e5f60718293a4b5c6d7e8f90';
const REPOSITORY_URL = 'https://github.com/AIssoufi/issoufi.fr';
const RUN_URL = `${REPOSITORY_URL}/actions/runs/123`;

describe('parseCommitLog', () => {
  it('reads the SHA and the subject of each line', () => {
    const log = [
      `${SHA}\tMerge pull request #140 from AIssoufi/ISF-134`,
      `${OTHER_SHA}\tchore(develop): release 1.4.0`,
      '',
    ].join('\n');
    expect(parseCommitLog(log)).toEqual([
      { sha: SHA, subject: 'Merge pull request #140 from AIssoufi/ISF-134' },
      { sha: OTHER_SHA, subject: 'chore(develop): release 1.4.0' },
    ]);
  });

  it('splits at the first tab only, and trims the subject', () => {
    expect(parseCommitLog(`${SHA}\t fix: a\ttab \n`)).toEqual([
      { sha: SHA, subject: 'fix: a\ttab' },
    ]);
  });

  it('keeps a commit with an empty subject', () => {
    expect(parseCommitLog(`${SHA}\t`)).toEqual([{ sha: SHA, subject: '' }]);
  });

  it('keeps accents, emoji and Markdown characters of a subject', () => {
    expect(parseCommitLog(`${SHA}\tdocs: décrire le *déploiement* 🚀 <main>`)).toEqual([
      { sha: SHA, subject: 'docs: décrire le *déploiement* 🚀 <main>' },
    ]);
  });

  it.each([
    `${SHA} Merge pull request #140`,
    `\t${SHA}\tMerge pull request #140`,
    `58ff9ea\tMerge pull request #140`,
    `${SHA.toUpperCase()}\tMerge pull request #140`,
    'fatal: bad revision',
    '\n\n',
  ])('leaves out the line %j', log => {
    expect(parseCommitLog(log)).toEqual([]);
  });

  it.each([undefined, null, '', 42, ['log']])('returns no commit for %o', log => {
    expect(parseCommitLog(log)).toEqual([]);
  });
});

describe('getRepositoryUrl', () => {
  it('builds the address of the repository on github.com', () => {
    expect(getRepositoryUrl({ repository: 'AIssoufi/issoufi.fr' })).toBe(REPOSITORY_URL);
  });

  it('takes another server, without its trailing slash', () => {
    expect(getRepositoryUrl({ serverUrl: 'https://example.com/', repository: 'owner/repo' })).toBe(
      'https://example.com/owner/repo',
    );
  });

  it.each([
    { repository: undefined },
    { repository: '' },
    { repository: 'issoufi.fr' },
    { repository: 'owner/repo/extra' },
    { repository: 42 },
    { repository: 'owner/repo', serverUrl: 'github.com' },
    { repository: 'owner/repo', serverUrl: '' },
  ])('returns undefined for %o', params => {
    expect(getRepositoryUrl(params)).toBeUndefined();
  });
});

describe('getMainCiRunsUrl', () => {
  it('links the CI runs of main', () => {
    expect(getMainCiRunsUrl(REPOSITORY_URL)).toBe(
      `${REPOSITORY_URL}/actions/workflows/ci.yml?query=branch%3Amain`,
    );
  });

  it.each([undefined, ''])('returns undefined without a repository (%o)', repositoryUrl => {
    expect(getMainCiRunsUrl(repositoryUrl)).toBeUndefined();
  });
});

describe('renderDeployReport', () => {
  const commits = [
    { sha: SHA, subject: 'Merge pull request #140 from AIssoufi/ISF-134' },
    { sha: OTHER_SHA, subject: 'Merge pull request #138 from AIssoufi/ISF-133' },
  ];

  it('lists the commits deployed and links the CI run of main', () => {
    expect(
      renderDeployReport({
        commits,
        deploySha: SHA,
        ciRunUrl: RUN_URL,
        repositoryUrl: REPOSITORY_URL,
      }),
    ).toBe(
      [
        '## Production deploy',
        '',
        `Deployed develop to main, up to [\`58ff9ea\`](${REPOSITORY_URL}/commit/${SHA}): 2 commits. The [CI of main](${RUN_URL}) now tests, builds and deploys it to production.`,
        '',
        `- [\`58ff9ea\`](${REPOSITORY_URL}/commit/${SHA}) Merge pull request #140 from AIssoufi/ISF-134`,
        `- [\`9ff31f7\`](${REPOSITORY_URL}/commit/${OTHER_SHA}) Merge pull request #138 from AIssoufi/ISF-133`,
        '',
      ].join('\n'),
    );
  });

  it('says what a dry run would deploy, without a CI run', () => {
    expect(
      renderDeployReport({
        commits: commits.slice(0, 1),
        deploySha: SHA,
        isDryRun: true,
        ciRunUrl: RUN_URL,
        repositoryUrl: REPOSITORY_URL,
      }),
    ).toBe(
      [
        '## Production deploy',
        '',
        `Dry run: deploying develop to main, up to [\`58ff9ea\`](${REPOSITORY_URL}/commit/${SHA}) would bring 1 commit. Nothing was pushed.`,
        '',
        `- [\`58ff9ea\`](${REPOSITORY_URL}/commit/${SHA}) Merge pull request #140 from AIssoufi/ISF-134`,
        '',
      ].join('\n'),
    );
  });

  it('shows the commits without links when the repository is unknown', () => {
    const report = renderDeployReport({ commits: commits.slice(0, 1), deploySha: SHA });
    expect(report).toContain('Deployed develop to main, up to `58ff9ea`: 1 commit.\n');
    expect(report).toContain('\n- `58ff9ea` Merge pull request #140 from AIssoufi/ISF-134\n');
  });

  it.each([undefined, ''])('leaves out the CI run when its address is %o', ciRunUrl => {
    expect(renderDeployReport({ commits, deploySha: SHA, ciRunUrl })).not.toContain('CI of main');
  });

  it('leaves out the deployed commit when its SHA is invalid', () => {
    expect(renderDeployReport({ commits, deploySha: '58ff9ea' })).toContain(
      'Deployed develop to main: 2 commits.',
    );
  });

  it('leaves out the entries that are not commits, and the subjects that are not text', () => {
    const report = renderDeployReport({
      commits: [null, 'commit', { sha: '58ff9ea' }, { sha: SHA, subject: 42 }],
      deploySha: SHA,
    });
    expect(report).toContain(': 1 commit.');
    expect(report).toContain('\n- `58ff9ea`\n');
    expect(report).not.toMatch(/undefined|null|42/);
  });

  it.each([undefined, null, [], 'commits'])('says that no commit was found for %o', value => {
    const report = renderDeployReport({ commits: value, deploySha: SHA });
    expect(report).toContain(': 0 commits.');
    expect(report).toContain('\n- No commit found.\n');
  });

  it('renders without any parameter', () => {
    expect(renderDeployReport({})).toBe(
      '## Production deploy\n\nDeployed develop to main: 0 commits.\n\n- No commit found.\n',
    );
  });
});
