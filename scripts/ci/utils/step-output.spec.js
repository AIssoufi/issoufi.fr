import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { setStepOutput } from './step-output.mjs';

describe('setStepOutput', () => {
  let directory;
  let outputFile;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'step-output-'));
    outputFile = join(directory, 'output');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    rmSync(directory, { recursive: true, force: true });
  });

  it('appends each output on its own line', () => {
    setStepOutput({ name: 'due', value: 'true', outputFile });
    setStepOutput({ name: 'sha', value: '58ff9ea', outputFile });
    expect(readFileSync(outputFile, 'utf8')).toBe('due=true\nsha=58ff9ea\n');
  });

  it('defaults to the file named by GITHUB_OUTPUT', () => {
    vi.stubEnv('GITHUB_OUTPUT', outputFile);
    setStepOutput({ name: 'due', value: 'false' });
    expect(readFileSync(outputFile, 'utf8')).toBe('due=false\n');
  });

  it('prints the output outside GitHub Actions', () => {
    vi.stubEnv('GITHUB_OUTPUT', '');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    setStepOutput({ name: 'due', value: 'true' });
    expect(log).toHaveBeenCalledWith('due=true');
  });

  it('writes an empty value when the value is missing', () => {
    setStepOutput({ name: 'sha', outputFile });
    expect(readFileSync(outputFile, 'utf8')).toBe('sha=\n');
  });

  it.each([undefined, null, '', 42])('refuses the name %o', name => {
    expect(() => setStepOutput({ name, value: 'true', outputFile })).toThrow(
      'A step output needs a name',
    );
  });

  it.each(['true\nsha=forged', 'true\r', '\n'])('refuses the value %j on several lines', value => {
    expect(() => setStepOutput({ name: 'due', value, outputFile })).toThrow(
      'The step output "due" must hold a single line',
    );
  });

  it('refuses a name on several lines', () => {
    expect(() => setStepOutput({ name: 'due\nsha', value: 'true', outputFile })).toThrow(
      'must hold a single line',
    );
  });
});
