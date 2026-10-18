// @vitest-environment node
import { STANDALONE_PAGE_FILE_NAME } from '../constants';
import { inlineScript, isEntryChunk, isServerOnlyPage, removePreloadMarkers } from './bundle';

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
