import { isBudgetedScript, isBuildFile } from './bundle-files.mjs';

describe('isBuildFile', () => {
  it.each([
    { path: 'chess.png', bytes: 928_988 },
    { path: 'assets/index.js', bytes: 788_320, gzipBytes: 224_940 },
    { path: 'a.png' },
  ])('accepts %o', value => {
    expect(isBuildFile(value)).toBe(true);
  });

  it.each([
    undefined,
    null,
    'chess.png',
    42,
    [],
    {},
    { bytes: 900 },
    { path: '' },
    { path: 42 },
    { path: null },
  ])('rejects %o', value => {
    expect(isBuildFile(value)).toBe(false);
  });
});

describe('isBudgetedScript', () => {
  it.each(['assets/x.js', 'assets/x.css', 'assets/nested/x.js'])('counts %s', path => {
    expect(isBudgetedScript(path)).toBe(true);
  });

  it.each([
    'x.js',
    'x.css',
    'assets/x.js.map',
    'assets/x.png',
    'assets/x.json',
    'assets/',
    'myassets/x.js',
    'public/assets/x.js',
  ])('leaves out %s', path => {
    expect(isBudgetedScript(path)).toBe(false);
  });

  it.each([undefined, null, '', 42, {}, ['assets/x.js']])(
    'leaves out the invalid path %s',
    path => {
      expect(isBudgetedScript(path)).toBe(false);
    },
  );
});
