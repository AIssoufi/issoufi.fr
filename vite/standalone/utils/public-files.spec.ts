// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { listFileNames, toRelativePublicUrls } from './public-files';

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
