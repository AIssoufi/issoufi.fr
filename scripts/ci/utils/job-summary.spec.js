import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { appendJobSummary } from './job-summary.mjs';

describe('appendJobSummary', () => {
  let directory;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'job-summary-'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    rmSync(directory, { recursive: true, force: true });
  });

  it('appends to the given summary file', () => {
    const summaryFile = join(directory, 'summary.md');
    appendJobSummary({ markdown: 'first\n', summaryFile });
    appendJobSummary({ markdown: 'second\n', summaryFile });
    expect(readFileSync(summaryFile, 'utf8')).toBe('first\nsecond\n');
  });

  it('defaults to the file named by GITHUB_STEP_SUMMARY', () => {
    const summaryFile = join(directory, 'summary.md');
    vi.stubEnv('GITHUB_STEP_SUMMARY', summaryFile);
    appendJobSummary({ markdown: 'report\n' });
    expect(readFileSync(summaryFile, 'utf8')).toBe('report\n');
  });

  it('prints the summary outside GitHub Actions', () => {
    vi.stubEnv('GITHUB_STEP_SUMMARY', '');
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    appendJobSummary({ markdown: 'report\n' });
    expect(write).toHaveBeenCalledWith('report\n');
  });

  it('adds nothing when the markdown is missing', () => {
    const summaryFile = join(directory, 'summary.md');
    appendJobSummary({ summaryFile });
    expect(readFileSync(summaryFile, 'utf8')).toBe('');
  });
});
