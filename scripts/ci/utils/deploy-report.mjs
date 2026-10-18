// @ts-check
import {
  CI_WORKFLOW_FILE,
  COMMIT_LOG_SEPARATOR,
  DEFAULT_GITHUB_SERVER_URL,
  DEVELOP_BRANCH,
  MAIN_BRANCH,
  REPOSITORY_PATTERN,
  TRAILING_SLASH_PATTERN,
} from '../constants.mjs';
import { toList } from './lists.mjs';
import { isCommitSha, shortenSha } from './workflow-runs.mjs';

/**
 * A commit deployed to production, read from `git log` by {@link parseCommitLog}.
 * @typedef {object} DeployedCommit
 * @property {string} sha - Full SHA of the commit.
 * @property {string} subject - First line of its message, e.g. `Merge pull request #140 from …`.
 */

/**
 * Reads the commits that `git log --format=%H%x09%s` lists (see `COMMIT_LOG_FORMAT`), one per
 * line, its SHA and its subject separated by a tab.
 * @param {unknown} log - Output of `git log`.
 * @returns {DeployedCommit[]} The commits in the order of the log. Empty lines, lines without a
 * tab and lines that do not start with a full SHA are left out, and so is any value that is not
 * a string.
 * @example
 * parseCommitLog('58ff9ea…\tMerge pull request #140 from AIssoufi/ISF-134\n');
 * // [{ sha: '58ff9ea…', subject: 'Merge pull request #140 from AIssoufi/ISF-134' }]
 */
export const parseCommitLog = log => {
  if (typeof log !== 'string') return [];

  return log.split('\n').flatMap(line => {
    const separatorIndex = line.indexOf(COMMIT_LOG_SEPARATOR);
    const sha = line.slice(0, separatorIndex);
    const hasSha = separatorIndex > 0 && isCommitSha(sha);
    if (!hasSha) return [];

    const subject = line.slice(separatorIndex + COMMIT_LOG_SEPARATOR.length).trim();
    return [{ sha, subject }];
  });
};

/**
 * Parameters of {@link getRepositoryUrl}.
 * @typedef {object} GetRepositoryUrlParams
 * @property {string} [serverUrl] - Web address of GitHub, the `GITHUB_SERVER_URL` variable.
 * Defaults to {@link DEFAULT_GITHUB_SERVER_URL}.
 * @property {string} [repository] - Repository as `owner/name`, the `GITHUB_REPOSITORY` variable.
 */

/**
 * Builds the web address of a repository on GitHub, to link its commits and its runs.
 * @param {GetRepositoryUrlParams} params
 * @returns {string | undefined} The address, without a trailing slash, or `undefined` when the
 * repository is not `owner/name` or the server address is invalid.
 * @example
 * getRepositoryUrl({ repository: 'AIssoufi/issoufi.fr' });
 * // 'https://github.com/AIssoufi/issoufi.fr'
 */
export const getRepositoryUrl = ({ serverUrl = DEFAULT_GITHUB_SERVER_URL, repository }) => {
  const isRepository = typeof repository === 'string' && REPOSITORY_PATTERN.test(repository);
  const canBuildUrl = isRepository && URL.canParse(serverUrl);
  if (!canBuildUrl) return undefined;

  return `${serverUrl.replace(TRAILING_SLASH_PATTERN, '')}/${repository}`;
};

/**
 * Builds the address of the list of CI runs on main, linked by the report when the run that the
 * push started cannot be found yet.
 * @param {string | undefined} repositoryUrl - Web address of the repository, from
 * {@link getRepositoryUrl}.
 * @returns {string | undefined} The address of the list, or `undefined` without a repository.
 * @example
 * getMainCiRunsUrl('https://github.com/AIssoufi/issoufi.fr');
 * // 'https://github.com/AIssoufi/issoufi.fr/actions/workflows/ci.yml?query=branch%3Amain'
 */
export const getMainCiRunsUrl = repositoryUrl => {
  if (!repositoryUrl) return undefined;

  const query = new URLSearchParams({ query: `branch:${MAIN_BRANCH}` });
  return `${repositoryUrl}/actions/workflows/${CI_WORKFLOW_FILE}?${query}`;
};

/**
 * Parameters of {@link renderDeployReport}.
 * @typedef {object} RenderDeployReportParams
 * @property {DeployedCommit[]} [commits] - Commits of develop that reach main, first parents
 * only, newest first, from {@link parseCommitLog}. Any value that is not an array counts as none.
 * @property {string} [deploySha] - Full SHA of the commit of develop that is deployed.
 * @property {boolean} [isDryRun] - Whether nothing was pushed, for a dry run. Defaults to `false`.
 * @property {string} [ciRunUrl] - Page of the CI run of main that the push started, or of the
 * list of those runs. Left out of a dry run.
 * @property {string} [repositoryUrl] - Web address of the repository, from
 * {@link getRepositoryUrl}, to link each commit. Without it, the commits are not linked.
 */

/**
 * Writes the production deploy as Markdown, for the job summary: the commits of develop that
 * reach main, and the CI run that deploys them, or what a dry run would deploy.
 * @param {RenderDeployReportParams} params
 * @returns {string} The Markdown report. Entries that are not commits are left out.
 * @example
 * renderDeployReport({ commits: [{ sha, subject: 'Merge pull request #140' }], deploySha: sha });
 * // '## Production deploy\n\nDeployed develop to main, up to `58ff9ea`: 1 commit.\n\n- `58ff9ea`
 * // Merge pull request #140\n'
 */
export const renderDeployReport = ({
  commits,
  deploySha,
  isDryRun = false,
  ciRunUrl,
  repositoryUrl,
}) => {
  const listedCommits = toList(commits).filter(commit => isCommitSha(commit?.sha));
  const count = listedCommits.length;
  const commitCount = count === 1 ? '1 commit' : `${count} commits`;

  /** @param {string} sha - Full SHA of a commit, shown short and linked to its page. */
  const linkCommit = sha => {
    const shortSha = `\`${shortenSha(sha)}\``;
    return repositoryUrl ? `[${shortSha}](${repositoryUrl}/commit/${sha})` : shortSha;
  };

  const target = isCommitSha(deploySha) ? `, up to ${linkCommit(deploySha)}` : '';
  const headline = isDryRun
    ? `Dry run: deploying ${DEVELOP_BRANCH} to ${MAIN_BRANCH}${target} would bring ${commitCount}. Nothing was pushed.`
    : `Deployed ${DEVELOP_BRANCH} to ${MAIN_BRANCH}${target}: ${commitCount}.`;

  const hasCiRun = !isDryRun && typeof ciRunUrl === 'string' && ciRunUrl !== '';
  const ciRun = hasCiRun
    ? ` The [CI of ${MAIN_BRANCH}](${ciRunUrl}) now tests, builds and deploys it to production.`
    : '';

  const lines = listedCommits.map(({ sha, subject }) => {
    const text = typeof subject === 'string' ? subject : '';
    return `- ${linkCommit(sha)} ${text}`.trimEnd();
  });
  const list = count > 0 ? lines.join('\n') : '- No commit found.';

  return `## Production deploy\n\n${headline}${ciRun}\n\n${list}\n`;
};
