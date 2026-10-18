// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ROUTER_MODULE, STANDALONE_PAGE_FILE_NAME } from './constants';
import { isAppRouterImport, isServerOnlyPage, listFileNames, toRelativePublicUrls } from './utils';

const APP_DIR = '/app/src';

describe('isAppRouterImport', () => {
  it.each([
    '/app/src/App/App.tsx',
    '/app/src/App/Header/NavMenu/NavMenu.tsx',
    '/app/src/index.tsx',
  ])('is true for an import of react-router from the app file %s', importer => {
    expect(isAppRouterImport({ source: ROUTER_MODULE, importer, appDir: APP_DIR })).toBe(true);
  });

  it('ignores a trailing slash of the app folder', () => {
    expect(
      isAppRouterImport({
        source: ROUTER_MODULE,
        importer: '/app/src/App/App.tsx',
        appDir: '/app/src/',
      }),
    ).toBe(true);
  });

  it.each([
    '/app/vite/standalone/react-router.ts',
    '/app/node_modules/react-i18next/dist/index.js',
    '/app/vite.config.ts',
    // Shares the beginning of the path of the app folder, but is another folder
    '/app/src-other/App.tsx',
    '/app/src',
  ])('is false for an import of react-router from %s, outside the app', importer => {
    expect(isAppRouterImport({ source: ROUTER_MODULE, importer, appDir: APP_DIR })).toBe(false);
  });

  it.each(['react', 'react-router-dom', 'react-router/dom', './react-router'])(
    'is false for an import of %s from the app',
    source => {
      expect(isAppRouterImport({ source, importer: '/app/src/App/App.tsx', appDir: APP_DIR })).toBe(
        false,
      );
    },
  );

  describe('edge cases', () => {
    it('is false without parameters', () => {
      expect(isAppRouterImport()).toBe(false);
      expect(isAppRouterImport({})).toBe(false);
    });

    it('is false for an entry point, which has no importer', () => {
      expect(isAppRouterImport({ source: ROUTER_MODULE, appDir: APP_DIR })).toBe(false);
    });

    it.each([undefined, '', '/', '///'])('is false for the app folder %j', appDir => {
      expect(
        isAppRouterImport({ source: ROUTER_MODULE, importer: '/app/src/App/App.tsx', appDir }),
      ).toBe(false);
    });

    it.each([42, null, ['/app/src']])('is false for the invalid app folder %j', appDir => {
      expect(
        isAppRouterImport({
          source: ROUTER_MODULE,
          importer: '/app/src/App/App.tsx',
          appDir: appDir as unknown as string,
        }),
      ).toBe(false);
    });

    it.each([42, null, {}])('is false for the invalid importer %j', importer => {
      expect(
        isAppRouterImport({
          source: ROUTER_MODULE,
          importer: importer as unknown as string,
          appDir: APP_DIR,
        }),
      ).toBe(false);
    });
  });
});

describe('toRelativePublicUrls', () => {
  const fileNames = ['home.webp', 'CV - Adam Issoufi.pdf', 'sewan.png'];

  it.each([
    ['const url = "/home.webp";', 'const url = "./home.webp";'],
    ["const url = '/home.webp';", "const url = './home.webp';"],
    ['const url = `/home.webp`;', 'const url = `./home.webp`;'],
    ['{ href: "/CV - Adam Issoufi.pdf" }', '{ href: "./CV - Adam Issoufi.pdf" }'],
  ])('makes the URL of a public file relative in %s', (code, expected) => {
    expect(toRelativePublicUrls({ code, fileNames })).toBe(expected);
  });

  it('makes the URLs relative in a JSON module that Vite turns into a string', () => {
    const code = String.raw`export default JSON.parse("{\"imageUrl\":\"/sewan.png\"}")`;
    const expected = String.raw`export default JSON.parse("{\"imageUrl\":\"./sewan.png\"}")`;

    expect(toRelativePublicUrls({ code, fileNames })).toBe(expected);
  });

  it('makes every URL of the code relative', () => {
    const code = 'a("/home.webp"); b("/sewan.png"); c("/home.webp");';

    expect(toRelativePublicUrls({ code, fileNames })).toBe(
      'a("./home.webp"); b("./sewan.png"); c("./home.webp");',
    );
  });

  it('escapes the characters of a file name that have a meaning in a regular expression', () => {
    const names = ['logo (1)+[v2].png'];

    expect(toRelativePublicUrls({ code: '"/logo (1)+[v2].png"', fileNames: names })).toBe(
      '"./logo (1)+[v2].png"',
    );
    expect(toRelativePublicUrls({ code: '"/logo 1+v2.png"', fileNames: names })).toBe(
      '"/logo 1+v2.png"',
    );
  });

  it('picks the longest name when one name begins another', () => {
    const names = ['home.webp', 'home.webp.png'];

    expect(toRelativePublicUrls({ code: '"/home.webp.png"', fileNames: names })).toBe(
      '"./home.webp.png"',
    );
  });

  it.each([
    '"/home.webp.bak"',
    '"/assets/home.webp"',
    '"/home.webp?v=1"',
    '"https://issoufi.fr/home.webp"',
    '"./home.webp"',
    '"home.webp"',
    '"/projects"',
    '"/"',
    'const homeWebp = 1 / home.webp;',
  ])('leaves %s as it is, which is not the whole URL of a public file', code => {
    expect(toRelativePublicUrls({ code, fileNames })).toBe(code);
  });

  describe('edge cases', () => {
    it('returns an empty code without parameters', () => {
      expect(toRelativePublicUrls()).toBe('');
      expect(toRelativePublicUrls({})).toBe('');
    });

    it.each([undefined, null, 42, {}])('returns an empty code for the code %j', code => {
      expect(toRelativePublicUrls({ code: code as unknown as string, fileNames })).toBe('');
    });

    it('returns an empty code unchanged', () => {
      expect(toRelativePublicUrls({ code: '', fileNames })).toBe('');
    });

    it.each([undefined, null, 'home.webp', []])(
      'returns the code unchanged for the file names %j',
      names => {
        const code = 'const url = "/home.webp";';

        expect(
          toRelativePublicUrls({ code, fileNames: names as unknown as readonly string[] }),
        ).toBe(code);
      },
    );

    it('ignores the empty, blank and invalid file names', () => {
      const names = ['', '   ', 42, null, 'home.webp'] as unknown as readonly string[];

      expect(toRelativePublicUrls({ code: '"/" + "/home.webp"', fileNames: names })).toBe(
        '"/" + "./home.webp"',
      );
    });
  });
});

describe('isServerOnlyPage', () => {
  it.each(['projects.html', 'experiences.html', '404.html', 'nested/index.html'])(
    'is true for the page %s',
    fileName => {
      expect(isServerOnlyPage(fileName)).toBe(true);
    },
  );

  it('is false for the page of the standalone build', () => {
    expect(isServerOnlyPage(STANDALONE_PAGE_FILE_NAME)).toBe(false);
  });

  it.each([
    'README.txt',
    'home.webp',
    'assets/index-1a2b3c.js',
    'index.htm',
    'projects.html.bak',
    '',
  ])('is false for %j, which is not an HTML page', fileName => {
    expect(isServerOnlyPage(fileName)).toBe(false);
  });

  describe('edge cases', () => {
    it.each([undefined, null, 42, {}, ['projects.html']])('is false for %j', fileName => {
      expect(isServerOnlyPage(fileName)).toBe(false);
    });
  });
});

describe('listFileNames', () => {
  let dir = '';

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'standalone-public-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('lists the files at the root of the folder', () => {
    writeFileSync(join(dir, 'home.webp'), '');
    writeFileSync(join(dir, 'CV - Adam Issoufi.pdf'), '');

    expect(listFileNames(dir).sort()).toEqual(['CV - Adam Issoufi.pdf', 'home.webp']);
  });

  it('leaves out the subfolders and their files', () => {
    writeFileSync(join(dir, 'home.webp'), '');
    mkdirSync(join(dir, 'fonts'));
    writeFileSync(join(dir, 'fonts', 'montserrat.woff2'), '');

    expect(listFileNames(dir)).toEqual(['home.webp']);
  });

  it('returns no name for an empty folder', () => {
    expect(listFileNames(dir)).toEqual([]);
  });

  describe('edge cases', () => {
    it('returns no name for a folder that does not exist', () => {
      expect(listFileNames(join(dir, 'missing'))).toEqual([]);
    });

    it('returns no name for a file', () => {
      const file = join(dir, 'home.webp');
      writeFileSync(file, '');

      expect(listFileNames(file)).toEqual([]);
    });

    it.each([undefined, null, '', 42, {}])('returns no name for the folder %j', value => {
      expect(listFileNames(value)).toEqual([]);
    });
  });
});
