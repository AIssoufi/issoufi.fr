// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  findExactFile,
  getNotFoundPageFiles,
  getRequestPathname,
  getServedFiles,
  isExactFile,
} from './utils.ts';

/** Files of the fake build, from its root. */
const BUILD_FILES = [
  'index.html',
  'projects.html',
  '404.html',
  'en/index.html',
  'en/404.html',
  'assets/index-a1b2.js',
];

describe('getRequestPathname', () => {
  it('reads the path of a URL', () => {
    expect(getRequestPathname('/en/projects')).toBe('/en/projects');
    expect(getRequestPathname('/')).toBe('/');
  });

  it('drops the query and the fragment', () => {
    expect(getRequestPathname('/projects?a=1&b=2')).toBe('/projects');
    expect(getRequestPathname('/projects#top')).toBe('/projects');
    expect(getRequestPathname('/projects?a=1#top')).toBe('/projects');
    expect(getRequestPathname('/?')).toBe('/');
  });

  it('decodes the path', () => {
    expect(getRequestPathname('/projets/un%20lien?a=1')).toBe('/projets/un lien');
    expect(getRequestPathname('/%C3%A9t%C3%A9')).toBe('/été');
  });

  it('ignores a path that does not decode', () => {
    expect(getRequestPathname('/%E0%A4%A')).toBeUndefined();
    expect(getRequestPathname('/%')).toBeUndefined();
  });

  it('ignores a URL that does not start with a slash', () => {
    expect(getRequestPathname('*')).toBeUndefined();
    expect(getRequestPathname('http://localhost/projects')).toBeUndefined();
    expect(getRequestPathname('')).toBeUndefined();
  });

  it('ignores a value that is not a string', () => {
    expect(getRequestPathname(undefined)).toBeUndefined();
    expect(getRequestPathname(null)).toBeUndefined();
    expect(getRequestPathname(404)).toBeUndefined();
    expect(getRequestPathname(['/projects'])).toBeUndefined();
  });
});

describe('getServedFiles', () => {
  it('lists the file, the page and the folder index of a path', () => {
    expect(getServedFiles('/projects')).toEqual([
      'projects',
      'projects.html',
      'projects/index.html',
    ]);
    expect(getServedFiles('/en/404.html')).toEqual([
      'en/404.html',
      'en/404.html.html',
      'en/404.html/index.html',
    ]);
  });

  it('lists the folder index and the page of a path with a trailing slash', () => {
    expect(getServedFiles('/en/')).toEqual(['en/index.html', 'en.html']);
    expect(getServedFiles('/en/projects/')).toEqual(['en/projects/index.html', 'en/projects.html']);
  });

  it('lists the index of the root alone', () => {
    expect(getServedFiles('/')).toEqual(['index.html']);
  });

  it('keeps the empty segments of a path', () => {
    expect(getServedFiles('//')).toEqual(['/index.html', '.html']);
  });
});

describe('getNotFoundPageFiles', () => {
  it('lists the not found page of the root for a path at the root', () => {
    expect(getNotFoundPageFiles('/nope')).toEqual(['404.html']);
    expect(getNotFoundPageFiles('/')).toEqual(['404.html']);
  });

  it('lists the not found page of each folder, the closest first', () => {
    expect(getNotFoundPageFiles('/en/nope')).toEqual(['en/404.html', '404.html']);
    expect(getNotFoundPageFiles('/en/a/b')).toEqual(['en/a/404.html', 'en/404.html', '404.html']);
  });

  it('counts the folder of a trailing slash', () => {
    expect(getNotFoundPageFiles('/en/')).toEqual(['en/404.html', '404.html']);
  });
});

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
