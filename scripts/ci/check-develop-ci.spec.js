import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

// Runs check-develop-ci.mjs against a local server standing for the REST API of GitHub

const SHA = '58ff9ea0c3f4e1b2a9d8c7b6a5f4e3d2c1b0a9f8';
const REPOSITORY = 'AIssoufi/issoufi.fr';
const RUN_URL = `https://github.com/${REPOSITORY}/actions/runs/123`;
const LIST_PATH = `/repos/${REPOSITORY}/actions/workflows/ci.yml/runs`;
const RUN_PATH = `/repos/${REPOSITORY}/actions/runs/123`;

/** A run of the CI of develop, as the REST API writes it. */
const apiRun = (fields = {}) => ({
  id: 123,
  head_sha: SHA,
  status: 'completed',
  conclusion: 'success',
  created_at: '2026-10-19T05:00:00Z',
  html_url: RUN_URL,
  ...fields,
});

const runFile = promisify(execFile);

describe('check-develop-ci.mjs', () => {
  let directory;
  let outputFile;
  let server;
  let apiUrl;
  /** Answers of the server: the runs that the list gives, and the reads of the run in turn. */
  let listedRuns;
  let runReads;
  let requestedPaths;

  /** Runs the script as the ci step of deploy-production.yml does, and returns what it did. */
  const runScript = async ({ sha = SHA } = {}) => {
    const env = {
      PATH: process.env.PATH,
      DEPLOY_SHA: sha,
      GITHUB_API_URL: apiUrl,
      GITHUB_REPOSITORY: REPOSITORY,
      GITHUB_TOKEN: 'token',
      GITHUB_OUTPUT: outputFile,
    };
    const args = ['scripts/ci/check-develop-ci.mjs'];
    try {
      const { stdout } = await runFile(process.execPath, args, { env, encoding: 'utf8' });
      return { exitCode: 0, log: stdout, output: readFileSync(outputFile, 'utf8') };
    } catch (error) {
      return { exitCode: error.code, log: error.stdout, output: readFileSync(outputFile, 'utf8') };
    }
  };

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), 'check-develop-ci-'));
    outputFile = join(directory, 'output');
    writeFileSync(outputFile, '');
    listedRuns = [];
    runReads = [];
    requestedPaths = [];

    server = createServer((request, response) => {
      const { pathname } = new URL(request.url, 'http://localhost');
      requestedPaths.push(pathname);
      let body;
      if (pathname === LIST_PATH) body = { workflow_runs: listedRuns };
      if (pathname === RUN_PATH) body = runReads.length > 1 ? runReads.shift() : runReads[0];
      response.writeHead(body ? 200 : 500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(body ?? { message: 'Server Error' }));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    apiUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterEach(async () => {
    await new Promise(resolve => server.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  });

  it('deploys a commit whose CI passed', async () => {
    listedRuns = [apiRun()];

    const { exitCode, log, output } = await runScript();

    expect(exitCode).toBe(0);
    expect(log).toContain(`The CI of develop passed on 58ff9ea: ${RUN_URL}`);
    expect(output).toBe(`sha=${SHA}\n`);
    expect(requestedPaths).toEqual([LIST_PATH]);
  });

  it('waits for a CI still running, then deploys the commit once it passed', async () => {
    listedRuns = [apiRun({ status: 'in_progress', conclusion: null })];
    runReads = [apiRun()];

    const { exitCode, log, output } = await runScript();

    expect(exitCode).toBe(0);
    expect(log).toContain(`Waiting for the run still going on 58ff9ea (in_progress): ${RUN_URL}`);
    expect(output).toBe(`sha=${SHA}\n`);
    expect(requestedPaths).toEqual([LIST_PATH, RUN_PATH]);
  });

  it('fails with a warning when the CI that it waited for failed', async () => {
    listedRuns = [apiRun({ status: 'queued', conclusion: null })];
    runReads = [apiRun({ conclusion: 'failure' })];

    const { exitCode, log, output } = await runScript();

    expect(exitCode).toBe(1);
    expect(log).toContain(
      `::warning::Nothing deployed: a later scheduled run tries again, since the CI of develop did not pass on 58ff9ea (failure): ${RUN_URL}`,
    );
    expect(output).toBe('');
  });

  it('fails with a warning, without waiting, when the CI failed', async () => {
    listedRuns = [apiRun({ conclusion: 'failure' })];

    const { exitCode, log, output } = await runScript();

    expect(exitCode).toBe(1);
    expect(log).toContain('::warning::Nothing deployed: a later scheduled run tries again');
    expect(output).toBe('');
    expect(requestedPaths).toEqual([LIST_PATH]);
  });

  it('fails with a warning, without waiting, when the CI waits for approval', async () => {
    listedRuns = [apiRun({ conclusion: 'action_required' })];

    const { exitCode, log, output } = await runScript();

    expect(exitCode).toBe(1);
    expect(log).toContain(
      `::warning::Nothing deployed: a later scheduled run tries again, since the CI of develop is waiting for someone to approve it on 58ff9ea: ${RUN_URL}`,
    );
    expect(output).toBe('');
    expect(requestedPaths).toEqual([LIST_PATH]);
  });

  it('fails with a notice when the CI has not run on the commit', async () => {
    const { exitCode, log, output } = await runScript();

    expect(exitCode).toBe(1);
    expect(log).toContain(
      '::notice::Nothing deployed: a later scheduled run tries again, since the CI has not run on develop for 58ff9ea.',
    );
    expect(output).toBe('');
  });

  it('fails with an error when the API answers with an error', async () => {
    apiUrl = `${apiUrl}/missing`;

    const { exitCode, log, output } = await runScript();

    expect(exitCode).toBe(1);
    expect(log).toContain('::error::The GitHub API answered 500');
    expect(output).toBe('');
  });

  it.each(['', '58ff9ea'])('fails without asking the API for the commit %o', async sha => {
    const { exitCode, log, output } = await runScript({ sha });

    expect(exitCode).toBe(1);
    expect(log).toContain(`::error::Invalid commit "${sha}"`);
    expect(output).toBe('');
    expect(requestedPaths).toEqual([]);
  });
});
