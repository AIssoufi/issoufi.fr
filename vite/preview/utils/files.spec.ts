// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { findExactFile, isExactFile } from './files.ts';
import { getNotFoundPageFiles, getServedFiles } from './paths.ts';

/** Files of the fake build, from its root. */
const BUILD_FILES = [
  'index.html',
  'projects.html',
  '404.html',
  'en/index.html',
  'en/404.html',
  'assets/index-a1b2.js',
];

describe('with a build', () => {
  let root = '';

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'preview-not-found-'));
    BUILD_FILES.forEach(file => {
      mkdirSync(join(root, file, '..'), { recursive: true });
      writeFileSync(join(root, file), file);
    });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  describe('isExactFile', () => {
    it('finds a file of the build', () => {
      expect(isExactFile({ root, file: 'index.html' })).toBe(true);
      expect(isExactFile({ root, file: 'en/404.html' })).toBe(true);
      expect(isExactFile({ root, file: 'assets/index-a1b2.js' })).toBe(true);
    });

    it('refuses a path that differs in case', () => {
      expect(isExactFile({ root, file: 'Projects.html' })).toBe(false);
      expect(isExactFile({ root, file: 'PROJECTS.html' })).toBe(false);
      expect(isExactFile({ root, file: 'EN/index.html' })).toBe(false);
      expect(isExactFile({ root, file: 'Assets/index-a1b2.js' })).toBe(false);
    });

    it('refuses a folder', () => {
      expect(isExactFile({ root, file: 'en' })).toBe(false);
      expect(isExactFile({ root, file: 'assets' })).toBe(false);
    });

    it('refuses a file read as a folder', () => {
      expect(isExactFile({ root, file: 'projects.html/index.html' })).toBe(false);
    });

    it('refuses a missing path', () => {
      expect(isExactFile({ root, file: 'nope.html' })).toBe(false);
      expect(isExactFile({ root, file: 'en/nope/404.html' })).toBe(false);
      expect(isExactFile({ root, file: '' })).toBe(false);
    });

    it('refuses the parent folder and the empty segments', () => {
      expect(isExactFile({ root, file: 'en/../404.html' })).toBe(false);
      expect(isExactFile({ root, file: '../index.html' })).toBe(false);
      expect(isExactFile({ root, file: '/index.html' })).toBe(false);
      expect(isExactFile({ root, file: 'en//404.html' })).toBe(false);
    });

    it('refuses every path of a missing root', () => {
      expect(isExactFile({ root: join(root, 'missing'), file: 'index.html' })).toBe(false);
    });
  });

  describe('findExactFile', () => {
    it('finds the first file of the build, case included', () => {
      expect(findExactFile({ root, files: getServedFiles('/projects') })).toBe('projects.html');
      expect(findExactFile({ root, files: getServedFiles('/en') })).toBe('en/index.html');
      expect(findExactFile({ root, files: getServedFiles('/en/') })).toBe('en/index.html');
      expect(findExactFile({ root, files: getNotFoundPageFiles('/en/a/b') })).toBe('en/404.html');
      expect(findExactFile({ root, files: getNotFoundPageFiles('/nope') })).toBe('404.html');
    });

    it('finds none for a path that differs in case or names no file', () => {
      expect(findExactFile({ root, files: getServedFiles('/Projects') })).toBeUndefined();
      expect(findExactFile({ root, files: getServedFiles('/EN/') })).toBeUndefined();
      expect(findExactFile({ root, files: getServedFiles('/nope') })).toBeUndefined();
    });

    it('finds none in an empty list', () => {
      expect(findExactFile({ root, files: [] })).toBeUndefined();
    });
  });
});
