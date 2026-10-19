// @vitest-environment node
import { SITEMAP_FILE_NAME } from '../../../src/utils/sitemap';
import { HEADERS_FILE_NAME } from '../../constants';
import { STANDALONE_PAGE_FILE_NAME } from '../constants';
import { inlineScript, isEntryChunk, isServerOnlyFile, removePreloadMarkers } from './bundle';

describe('isServerOnlyFile', () => {
  it.each(['projects.html', 'experiences.html', '404.html', 'nested/index.html'])(
    'is true for the page %s',
    fileName => {
      expect(isServerOnlyFile(fileName)).toBe(true);
    },
  );

  it('is true for the headers of Cloudflare Pages, at the root of the build', () => {
    expect(isServerOnlyFile(HEADERS_FILE_NAME)).toBe(true);
  });

  it.each(['manifest.webmanifest', 'en/manifest.webmanifest'])(
    'is true for the web app manifest %s, which no browser installs from the disk',
    fileName => {
      expect(isServerOnlyFile(fileName)).toBe(true);
    },
  );

  it.each(['manifest.json', 'manifest.webmanifest.bak', 'webmanifest'])(
    'is false for %j, which is not a web app manifest of the build',
    fileName => {
      expect(isServerOnlyFile(fileName)).toBe(false);
    },
  );

  it('is false for the page of the standalone build', () => {
    expect(isServerOnlyFile(STANDALONE_PAGE_FILE_NAME)).toBe(false);
  });

  it.each([
    'README.txt',
    'home.webp',
    'assets/index-1a2b3c.js',
    'index.htm',
    'projects.html.bak',
    '',
  ])('is false for %j, which is not an HTML page', fileName => {
    expect(isServerOnlyFile(fileName)).toBe(false);
  });

  it.each(['_headers.txt', 'headers', '_Headers', 'nested/_headers', ' _headers'])(
    'is false for %j, which Cloudflare Pages does not read as its headers',
    fileName => {
      expect(isServerOnlyFile(fileName)).toBe(false);
    },
  );

  it('is true for the sitemap, at the root of the build, which no search engine reads from the disk', () => {
    expect(isServerOnlyFile(SITEMAP_FILE_NAME)).toBe(true);
  });

  it.each(['sitemap.xml.bak', 'sitemap', 'Sitemap.xml', 'en/sitemap.xml', ' sitemap.xml'])(
    'is false for %j, which is not the sitemap of the build',
    fileName => {
      expect(isServerOnlyFile(fileName)).toBe(false);
    },
  );

  describe('edge cases', () => {
    it.each([undefined, null, 42, {}, ['projects.html'], ['_headers'], ['manifest.webmanifest']])(
      'is false for %j',
      fileName => {
        expect(isServerOnlyFile(fileName)).toBe(false);
      },
    );
  });
});

describe('isEntryChunk', () => {
  it('is true for an entry chunk', () => {
    expect(isEntryChunk({ type: 'chunk', isEntry: true, fileName: 'assets/index-1a2b.js' })).toBe(
      true,
    );
  });

  it.each([
    { type: 'chunk', isEntry: false, fileName: 'assets/Projects-1a2b.js' },
    { type: 'chunk', fileName: 'assets/Projects-1a2b.js' },
    { type: 'asset', fileName: 'index.html' },
    { type: 'asset', isEntry: true, fileName: 'index.html' },
    { type: 'chunk', isEntry: 'true' },
  ])('is false for %j', file => {
    expect(isEntryChunk(file)).toBe(false);
  });

  describe('edge cases', () => {
    it.each([undefined, null, 42, 'chunk', [], {}])('is false for %j', file => {
      expect(isEntryChunk(file)).toBe(false);
    });
  });
});

describe('removePreloadMarkers', () => {
  it('replaces every marker, quoted or not, with void 0', () => {
    const code = 'p(() => a, __VITE_PRELOAD__, u); p(() => b, "__VITE_PRELOAD__", u);';

    expect(removePreloadMarkers(code)).toBe('p(() => a, void 0, u); p(() => b, void 0, u);');
  });

  it('leaves a code without marker as it is', () => {
    const code = 'const preload = ["assets/a.js"];';

    expect(removePreloadMarkers(code)).toBe(code);
  });

  describe('edge cases', () => {
    it.each([undefined, null, 42, {}])('returns an empty code for %j', code => {
      expect(removePreloadMarkers(code)).toBe('');
    });

    it('returns an empty code unchanged', () => {
      expect(removePreloadMarkers('')).toBe('');
    });
  });
});

describe('inlineScript', () => {
  const html =
    '<head><script type="module" crossorigin src="./assets/index-1a2b.js"></script></head>';
  const fileName = 'assets/index-1a2b.js';

  it('puts the code in the tag that loads the file, keeping its other attributes', () => {
    expect(inlineScript({ html, fileName, code: 'run();' })).toBe(
      '<head><script type="module" crossorigin>run();</script></head>',
    );
  });

  it.each([
    '/assets/index-1a2b.js',
    'assets/index-1a2b.js',
    'https://cdn.test/assets/index-1a2b.js',
  ])('finds the tag whose src is %j', src => {
    const page = `<script type="module" src="${src}"></script>`;

    expect(inlineScript({ html: page, fileName, code: 'run();' })).toBe(
      '<script type="module">run();</script>',
    );
  });

  it('keeps the attributes written after src', () => {
    const page = '<script src="./assets/index-1a2b.js" type="module"></script>';

    expect(inlineScript({ html: page, fileName, code: 'run();' })).toBe(
      '<script type="module">run();</script>',
    );
  });

  it.each([
    ['console.log("</script>");', String.raw`console.log("\x3C/script>");`],
    ['console.log("</SCRIPT >");', String.raw`console.log("\x3C/SCRIPT >");`],
    ['const comment = "<!-- x -->";', String.raw`const comment = "\x3C!-- x -->";`],
  ])('escapes %s, which would end the tag early', (code, expected) => {
    expect(inlineScript({ html, fileName, code })).toBe(
      `<head><script type="module" crossorigin>${expected}</script></head>`,
    );
  });

  it('leaves the other tags of the code as they are', () => {
    const code = 'el.innerHTML = "<script><\\/script><div></div>";';

    expect(inlineScript({ html, fileName, code })).toBe(
      `<head><script type="module" crossorigin>${code}</script></head>`,
    );
  });

  it('keeps the $ of the code, which are no replacement patterns', () => {
    const code = "const price = '$1 $& $$';";

    expect(inlineScript({ html, fileName, code })).toBe(
      `<head><script type="module" crossorigin>${code}</script></head>`,
    );
  });

  it.each([
    'assets/index-9z9z.js',
    'index-1a2b.js.map',
    // The dot of the name matches only a dot
    'assets/index-1a2bXjs',
  ])('leaves the HTML as it is when no tag loads %j', otherFileName => {
    expect(inlineScript({ html, fileName: otherFileName, code: 'run();' })).toBe(html);
  });

  it('leaves a tag that already holds code as it is', () => {
    const page = '<script type="module">already();</script>';

    expect(inlineScript({ html: page, fileName, code: 'run();' })).toBe(page);
  });

  describe('edge cases', () => {
    it('returns an empty page without parameters', () => {
      expect(inlineScript()).toBe('');
      expect(inlineScript({})).toBe('');
    });

    it.each([undefined, null, 42, {}])('returns an empty page for the HTML %j', value => {
      expect(inlineScript({ html: value as unknown as string, fileName, code: 'run();' })).toBe('');
    });

    it.each([undefined, null, '', '   ', 42])(
      'returns the HTML unchanged for the file name %j',
      value => {
        expect(inlineScript({ html, fileName: value as unknown as string, code: 'run();' })).toBe(
          html,
        );
      },
    );

    it.each([undefined, null, 42, {}])('inlines an empty script for the code %j', value => {
      expect(inlineScript({ html, fileName, code: value as unknown as string })).toBe(
        '<head><script type="module" crossorigin></script></head>',
      );
    });
  });
});
