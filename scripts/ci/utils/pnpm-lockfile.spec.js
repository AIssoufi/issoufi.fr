import { readLockedVersion } from './pnpm-lockfile.mjs';

const packageName = '@playwright/test';

/** Lockfile of pnpm whose root project depends on a package at the given entry lines. */
const lockfileWith = entryLines =>
  [
    "lockfileVersion: '9.0'",
    '',
    'importers:',
    '',
    '  .:',
    '    devDependencies:',
    "      '@eslint/js':",
    '        specifier: ^10.0.1',
    '        version: 10.0.1(eslint@10.12.0)',
    ...entryLines,
    "      '@testing-library/dom':",
    '        specifier: ^10.4.2',
    '        version: 10.4.2',
    '',
    'packages:',
    '',
    "  '@playwright/test@1.63.0':",
    '    resolution: {integrity: sha512-x}',
  ].join('\n');

describe('readLockedVersion', () => {
  it('reads the version of the package that the root project installs', () => {
    const source = lockfileWith([
      "      '@playwright/test':",
      '        specifier: ^1.64.0',
      '        version: 1.64.0',
    ]);

    expect(readLockedVersion({ source, packageName })).toBe('1.64.0');
    expect(readLockedVersion({ source, packageName: '@testing-library/dom' })).toBe('10.4.2');
  });

  it('reads a version written before the specifier, in quotes or with peer dependencies', () => {
    const quoted = lockfileWith([
      '      "@playwright/test":',
      "        version: '1.64.0'",
      '        specifier: ^1.64.0',
    ]);
    const withPeers = lockfileWith([
      '      "@playwright/test":',
      '        specifier: ^1.64.0',
      '        version: 1.64.0(react@19.2.0)',
    ]);

    expect(readLockedVersion({ source: quoted, packageName })).toBe('1.64.0');
    expect(readLockedVersion({ source: withPeers, packageName })).toBe('1.64.0');
  });

  it('reads the lockfile of Windows, whose lines end with a carriage return', () => {
    const source = lockfileWith([
      "      '@playwright/test':",
      '        specifier: ^1.64.0',
      '        version: 1.65.0',
    ]).replaceAll('\n', '\r\n');

    expect(readLockedVersion({ source, packageName })).toBe('1.65.0');
  });

  it('reads a lockfile that ends on the entry, with no section and no line break after it', () => {
    const source = [
      'importers:',
      '  .:',
      '    devDependencies:',
      "      '@playwright/test':",
      '        version: 1.64.0',
    ].join('\n');

    expect(readLockedVersion({ source, packageName })).toBe('1.64.0');
  });

  it('finds no version when the root project does not depend on the package', () => {
    const source = lockfileWith([]);

    expect(readLockedVersion({ source, packageName })).toBeUndefined();
  });

  it('skips the entries of packages:, where another package may depend on it', () => {
    const source = [
      'importers:',
      '  .:',
      '    devDependencies:',
      "      '@eslint/js':",
      '        version: 10.0.1',
      'packages:',
      "  '@playwright/test':",
      '    version: 1.64.0',
      'snapshots:',
      "  '@vitest/browser-playwright@5.0.4':",
      '    dependencies:',
      "      '@playwright/test': 1.64.0",
    ].join('\n');

    expect(readLockedVersion({ source, packageName })).toBeUndefined();
  });

  it('finds no version in an entry without one, or whose version line holds none', () => {
    const withoutVersion = lockfileWith([
      "      '@playwright/test':",
      '        specifier: ^1.64.0',
    ]);
    const emptyVersion = lockfileWith(["      '@playwright/test':", '        version:']);

    expect(readLockedVersion({ source: withoutVersion, packageName })).toBeUndefined();
    expect(readLockedVersion({ source: emptyVersion, packageName })).toBeUndefined();
  });

  it('skips a version key that belongs to the next dependency', () => {
    const source = lockfileWith(["      '@playwright/test':"]);

    expect(readLockedVersion({ source, packageName })).toBeUndefined();
  });

  it('finds no version in a lockfile without importers:, empty, or that is not a text', () => {
    expect(readLockedVersion({ source: "lockfileVersion: '9.0'\n", packageName })).toBeUndefined();
    expect(readLockedVersion({ source: '', packageName })).toBeUndefined();
    expect(readLockedVersion({ source: undefined, packageName })).toBeUndefined();
    expect(readLockedVersion({ source: null, packageName })).toBeUndefined();
    expect(readLockedVersion({ source: ['importers:'], packageName })).toBeUndefined();
  });

  it('finds no version for a missing package name, an empty one or one that is not a text', () => {
    const source = lockfileWith([
      "      '@playwright/test':",
      '        version: 1.64.0',
      "      '':",
      '        version: 0.0.1',
    ]);

    expect(readLockedVersion({ source })).toBeUndefined();
    expect(readLockedVersion({ source, packageName: null })).toBeUndefined();
    expect(readLockedVersion({ source, packageName: ['@playwright/test'] })).toBeUndefined();
    expect(readLockedVersion({ source, packageName: '' })).toBeUndefined();
    expect(readLockedVersion()).toBeUndefined();
  });
});
