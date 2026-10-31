import { dispatchWorkflow, readDispatchedRun } from './workflow-dispatch.mjs';
import { RUNS_URL, stubGitHub, stubGitHubEnv } from './testUtils.js';

describe('readDispatchedRun', () => {
  const RUN_API_URL = 'https://api.github.com/repos/AIssoufi/issoufi.fr/actions/runs/501';

  it('reads the run that the dispatch started', () => {
    expect(
      readDispatchedRun({
        workflow_run_id: 501,
        run_url: RUN_API_URL,
        html_url: `${RUNS_URL}/501`,
      }),
    ).toEqual({ id: 501, url: `${RUNS_URL}/501` });
  });

  it.each([
    undefined,
    null,
    '',
    {},
    { workflow_run_id: 501 },
    { html_url: `${RUNS_URL}/501` },
    { workflow_run_id: 0, html_url: `${RUNS_URL}/501` },
    { workflow_run_id: -1, html_url: `${RUNS_URL}/501` },
    { workflow_run_id: 1.5, html_url: `${RUNS_URL}/501` },
    { workflow_run_id: Number.NaN, html_url: `${RUNS_URL}/501` },
    { workflow_run_id: '501', html_url: `${RUNS_URL}/501` },
    { workflow_run_id: 501, html_url: '' },
    { workflow_run_id: 501, html_url: 42 },
  ])('returns undefined for %o', response => {
    expect(readDispatchedRun(response)).toBeUndefined();
  });
});

describe('the API calls on runs', () => {
  const RUNS_API_URL = 'https://api.github.com/repos/AIssoufi/issoufi.fr/actions';

  beforeEach(() => {
    stubGitHubEnv();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('dispatchWorkflow', () => {
    /** Answers the start of the given workflow with the run 501. */
    const stubDispatch = workflow =>
      stubGitHub({
        [`POST /actions/workflows/${workflow}/dispatches`]: [
          { body: { workflow_run_id: 501, html_url: `${RUNS_URL}/501` } },
        ],
      });

    it('starts a workflow on a branch and reads the run it started', async () => {
      const requests = stubDispatch('ci.yml');
      await expect(dispatchWorkflow({ workflow: 'ci.yml', ref: 'develop' })).resolves.toEqual({
        id: 501,
        url: `${RUNS_URL}/501`,
      });
      const [{ route, url, body }] = requests;
      expect(url).toBe(`${RUNS_API_URL}/workflows/ci.yml/dispatches`);
      expect(route).toBe('POST /actions/workflows/ci.yml/dispatches');
      expect(body).toEqual({ ref: 'develop', return_run_details: true });
    });

    it('sends the inputs of the workflow', async () => {
      const requests = stubDispatch('deploy-production.yml');
      await dispatchWorkflow({
        workflow: 'deploy-production.yml',
        ref: 'develop',
        inputs: { scheduled: 'true' },
      });
      expect(requests[0].body).toEqual({
        ref: 'develop',
        inputs: { scheduled: 'true' },
        return_run_details: true,
      });
    });

    it('throws when GitHub does not say which run it started', async () => {
      stubGitHub({ 'POST /actions/workflows/release.yml/dispatches': [{ status: 204 }] });
      await expect(dispatchWorkflow({ workflow: 'release.yml', ref: 'develop' })).rejects.toThrow(
        'GitHub started release.yml on develop without saying which run',
      );
    });

    it.each([
      [{ workflow: 'ci.yml', ref: '' }, '"ci.yml" on ""'],
      [{ workflow: '', ref: 'develop' }, '"" on "develop"'],
      [{ ref: 'develop' }, '"" on "develop"'],
      [{ workflow: 'ci.yml' }, '"ci.yml" on ""'],
      [{ workflow: 42, ref: 'develop' }, '"42" on "develop"'],
    ])('throws without asking the API for %o', async (params, details) => {
      const requests = stubDispatch('ci.yml');
      await expect(dispatchWorkflow(params)).rejects.toThrow(
        `Cannot start the workflow ${details}`,
      );
      expect(requests).toEqual([]);
    });
  });
});
