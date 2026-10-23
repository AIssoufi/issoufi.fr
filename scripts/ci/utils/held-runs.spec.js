import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import {
  CI_WORKFLOW_FILE,
  PULL_REQUEST_EVENT,
  PULL_REQUEST_WORKFLOW_FILES,
} from '../constants.mjs';
import { approveHeldRuns, nameRun } from './held-runs.mjs';
import {
  BRANCH,
  CREATED_AT,
  REPOSITORY,
  RUNS_URL,
  SHA,
  routesOf,
  stubGitHub,
  stubGitHubEnv,
} from './testUtils.js';
import { findKeyLines, listYamlFiles } from './yaml.mjs';

const WORKFLOWS_DIR = '.github/workflows';
// The key of a workflow that names the events it runs on, under it or on its line
const TRIGGERS_KEY = 'on';
// Columns of a top-level key and of an event under the `on` key, as findKeyLines counts them
const TOP_LEVEL_COLUMN = 1;
const TRIGGER_COLUMN = 3;
// What separates the events written on the line of the `on` key: `on: [push, pull_request]`
const INLINE_TRIGGERS_SEPARATOR = /[\s,[\]]+/;
const NAME = 'the release pull request #162';
const TITLE_WORKFLOW_FILE = 'pull-request-title.yml';
const TITLE_RUNS_ROUTE = `GET /actions/workflows/${TITLE_WORKFLOW_FILE}/runs`;
const FORBIDDEN = { status: 403, body: { message: 'Resource not accessible by integration' } };

/** A run as `readRun` gives it, by default the held run of the CI. */
const workflowRun = ({ id = 501, ...fields } = {}) => ({
  id,
  sha: SHA,
  status: 'completed',
  conclusion: 'action_required',
  createdAt: new Date(CREATED_AT),
  url: `${RUNS_URL}/${id}`,
  ...fields,
});

/** A run as the REST API writes it, by default the held run of the title lint. */
const apiRun = ({ id = 511, ...fields } = {}) => ({
  id,
  head_sha: SHA,
  status: 'completed',
  conclusion: 'action_required',
  created_at: CREATED_AT,
  html_url: `${RUNS_URL}/${id}`,
  ...fields,
});

/** The routes of a held CI and a held title lint on the same head, which GitHub lets approve. */
const heldRoutes = () => ({
  'POST /actions/runs/501/approve': [{ status: 201 }],
  [TITLE_RUNS_ROUTE]: [{ body: { workflow_runs: [apiRun()] } }],
  'POST /actions/runs/511/approve': [{ status: 201 }],
});

/** Approves the held runs of the release pull request, from the given run of its CI. */
const approveFrom = ciRun => approveHeldRuns({ name: NAME, branch: BRANCH, ciRun });

describe('nameRun', () => {
  it.each([
    [CI_WORKFLOW_FILE, 'the CI'],
    [TITLE_WORKFLOW_FILE, 'the pull-request-title.yml run'],
    ['other.yml', 'the other.yml run'],
  ])('names the run of %s', (workflow, name) => {
    expect(nameRun(workflow)).toBe(name);
  });
});

describe('approveHeldRuns', () => {
  beforeEach(() => {
    stubGitHubEnv();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('approves the held CI, then the held run of the title lint on its head', async () => {
    const requests = stubGitHub(heldRoutes());

    await expect(approveFrom(workflowRun())).resolves.toBeUndefined();
    expect(routesOf(requests)).toEqual([
      'POST /actions/runs/501/approve',
      TITLE_RUNS_ROUTE,
      'POST /actions/runs/511/approve',
    ]);
    const titleRunsQuery = new URL(requests[1].url).searchParams;
    expect(titleRunsQuery.get('event')).toBe(PULL_REQUEST_EVENT);
    expect(titleRunsQuery.get('branch')).toBe(BRANCH);
    expect(titleRunsQuery.get('head_sha')).toBe(SHA);
    expect(console.log).toHaveBeenCalledWith(
      `Approved the CI of ${NAME}, which GitHub held: ${RUNS_URL}/501`,
    );
    expect(console.log).toHaveBeenCalledWith(
      `Approved the pull-request-title.yml run of ${NAME}, which GitHub held: ${RUNS_URL}/511`,
    );
  });

  it('approves the held title lint alone when GitHub does not hold the CI', async () => {
    const requests = stubGitHub(heldRoutes());

    await expect(approveFrom(workflowRun({ conclusion: 'success' }))).resolves.toBeUndefined();
    expect(routesOf(requests)).toEqual([TITLE_RUNS_ROUTE, 'POST /actions/runs/511/approve']);
  });

  it.each([
    ['without a run on the head', { workflow_runs: [] }],
    ['with a run that it cannot read', { workflow_runs: [{ id: 'odd' }] }],
    ['with an answer without runs', {}],
    ['with an empty answer', undefined],
    ['with a run that passed', { workflow_runs: [apiRun({ conclusion: 'success' })] }],
    [
      'with a run in progress',
      { workflow_runs: [apiRun({ status: 'in_progress', conclusion: null })] },
    ],
  ])('approves the held CI alone %s of the title lint', async (_case, titleRuns) => {
    const requests = stubGitHub({ ...heldRoutes(), [TITLE_RUNS_ROUTE]: [{ body: titleRuns }] });

    await expect(approveFrom(workflowRun())).resolves.toBeUndefined();
    expect(routesOf(requests)).toEqual(['POST /actions/runs/501/approve', TITLE_RUNS_ROUTE]);
  });

  it('stops at the held CI that GitHub refuses to let it approve', async () => {
    const ciRun = workflowRun();
    const requests = stubGitHub({ ...heldRoutes(), 'POST /actions/runs/501/approve': [FORBIDDEN] });

    await expect(approveFrom(ciRun)).resolves.toEqual({
      workflow: CI_WORKFLOW_FILE,
      run: ciRun,
      reason: `The GitHub API answered 403 to https://api.github.com/repos/${REPOSITORY}/actions/runs/501/approve: Resource not accessible by integration`,
    });
    expect(routesOf(requests)).toEqual(['POST /actions/runs/501/approve']);
    expect(console.log).not.toHaveBeenCalled();
  });

  it('gives the held title lint that GitHub refuses to let it approve after the CI', async () => {
    stubGitHub({ ...heldRoutes(), 'POST /actions/runs/511/approve': [FORBIDDEN] });

    await expect(approveFrom(workflowRun())).resolves.toEqual({
      workflow: TITLE_WORKFLOW_FILE,
      run: workflowRun({ id: 511 }),
      reason: `The GitHub API answered 403 to https://api.github.com/repos/${REPOSITORY}/actions/runs/511/approve: Resource not accessible by integration`,
    });
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it('writes a failed approval that is not an error as text', async () => {
    stubGitHub({ ...heldRoutes(), 'POST /actions/runs/501/approve': [{ rejection: 'offline' }] });

    await expect(approveFrom(workflowRun())).resolves.toMatchObject({ reason: 'offline' });
  });

  it('throws when the runs of the title lint cannot be listed', async () => {
    const requests = stubGitHub({
      ...heldRoutes(),
      [TITLE_RUNS_ROUTE]: [{ status: 500, body: { message: 'Server Error' } }],
    });

    await expect(approveFrom(workflowRun())).rejects.toThrow('The GitHub API answered 500');
    expect(routesOf(requests)).toEqual(['POST /actions/runs/501/approve', TITLE_RUNS_ROUTE]);
  });
});

describe('the workflows whose held runs the daily release approves', () => {
  const isTopLevelKey = ({ column }) => column === TOP_LEVEL_COLUMN;
  const isTriggersKey = keyLine => isTopLevelKey(keyLine) && keyLine.key === TRIGGERS_KEY;
  const isTrigger = ({ column }) => column === TRIGGER_COLUMN;

  /**
   * The events that a workflow runs on: those written on the line of its `on` key, then the keys
   * right under it.
   */
  const readTriggers = source => {
    const keys = findKeyLines(source);
    const triggersIndex = keys.findIndex(isTriggersKey);
    const triggersKey = keys[triggersIndex];
    if (triggersKey === undefined) return [];

    const inlineTriggers = triggersKey.value.split(INLINE_TRIGGERS_SEPARATOR).filter(Boolean);
    const keysAfter = keys.slice(triggersIndex + 1);
    const nextTopIndex = keysAfter.findIndex(isTopLevelKey);
    const hasNextTopKey = nextTopIndex !== -1;
    const keysUnder = hasNextTopKey ? keysAfter.slice(0, nextTopIndex) : keysAfter;
    return [...inlineTriggers, ...keysUnder.filter(isTrigger).map(({ key }) => key)];
  };

  it.each([
    [
      'under the on key',
      'on:\n  push:\n  pull_request:\n    types: [opened]\njobs:\n  a:\n',
      ['push', PULL_REQUEST_EVENT],
    ],
    ['as the last key', 'name: x\non:\n  push:\n  pull_request:\n', ['push', PULL_REQUEST_EVENT]],
    [
      'on the line of the on key',
      'on: pull_request\njobs:\n  pull_request:\n',
      [PULL_REQUEST_EVENT],
    ],
    [
      'in a list on the line of the on key',
      'on: [push, pull_request]\n',
      ['push', PULL_REQUEST_EVENT],
    ],
    ['before a job named like an event', 'on:\n  push:\njobs:\n  pull_request:\n', ['push']],
    ['without an on key', 'jobs:\n  pull_request:\n', []],
    ['that is empty', '', []],
  ])('reads the events of a workflow written %s', (_form, source, events) => {
    expect(readTriggers(source)).toEqual(events);
  });

  it('are every workflow that runs on pull requests', () => {
    const pullRequestWorkflows = listYamlFiles(WORKFLOWS_DIR)
      .filter(file => readTriggers(readFileSync(file, 'utf8')).includes(PULL_REQUEST_EVENT))
      .map(file => basename(file));

    expect(pullRequestWorkflows).toEqual([...PULL_REQUEST_WORKFLOW_FILES].sort());
  });
});
