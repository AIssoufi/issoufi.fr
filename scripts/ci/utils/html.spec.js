import { readInitialLoadPaths, toBuildPath } from './html.mjs';

describe('toBuildPath', () => {
  it.each([
    ['/assets/index-abc.js', 'assets/index-abc.js'],
    ['./assets/index-abc.css', 'assets/index-abc.css'],
    ['assets/index-abc.js', 'assets/index-abc.js'],
    ['/assets/index-abc.js?v=2', 'assets/index-abc.js'],
    ['/assets/index-abc.css#theme', 'assets/index-abc.css'],
    ['  /assets/index-abc.js\n', 'assets/index-abc.js'],
  ])('turns %o into %s', (url, path) => {
    expect(toBuildPath(url)).toBe(path);
  });

  it.each([
    'https://fonts.googleapis.com/css2?family=Montserrat',
    'http://example.com/a.js',
    'HTTPS://EXAMPLE.COM/A.JS',
    '//cdn.example.com/a.js',
    'data:text/css,body{}',
  ])('gives an empty string for the external URL %s', url => {
    expect(toBuildPath(url)).toBe('');
  });

  it.each(['', '   ', '/', './', '?v=2', '#top'])(
    'gives an empty string for the URL without a path %o',
    url => {
      expect(toBuildPath(url)).toBe('');
    },
  );

  it.each([undefined, null, 42, {}, ['/assets/a.js']])('gives an empty string for %o', url => {
    expect(toBuildPath(url)).toBe('');
  });
});

describe('readInitialLoadPaths', () => {
  const homePage = `<!doctype html>
<html lang="fr">
  <head>
    <link
      rel="icon"
      href="/favicon.ico"
    />
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat&display=swap"
      rel="stylesheet"
    />
    <script type="module" crossorigin src="/assets/index-abc.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/vendor-abc.js">
    <link rel="stylesheet" crossorigin href="/assets/index-abc.css">
  </head>
  <body>
    <div id="welcome"></div>
  </body>
</html>`;

  it('lists the scripts, module preloads and style sheets of the build, scripts first', () => {
    expect(readInitialLoadPaths(homePage)).toEqual([
      'assets/index-abc.js',
      'assets/vendor-abc.js',
      'assets/index-abc.css',
    ]);
  });

  it('reads the attributes in any order and on any number of lines', () => {
    const html = [
      '<link\n  href="/assets/a.css"\n  crossorigin\n  rel="stylesheet"\n/>',
      '<script\n  src="/assets/a.js"\n  type="module"\n></script>',
    ].join('\n');
    expect(readInitialLoadPaths(html)).toEqual(['assets/a.js', 'assets/a.css']);
  });

  it('reads tags, attributes and relations in any case', () => {
    const html = '<SCRIPT SRC="/assets/a.js"></SCRIPT><LINK REL="StyleSheet" HREF="/assets/a.css">';
    expect(readInitialLoadPaths(html)).toEqual(['assets/a.js', 'assets/a.css']);
  });

  it('reads a link that lists several relations', () => {
    const html = '<link rel="preload  stylesheet" href="/assets/a.css">';
    expect(readInitialLoadPaths(html)).toEqual(['assets/a.css']);
  });

  it('lists each file once', () => {
    const html = [
      '<script type="module" src="/assets/a.js"></script>',
      '<link rel="modulepreload" href="/assets/a.js">',
      '<link rel="modulepreload" href="./assets/a.js?v=2">',
    ].join('');
    expect(readInitialLoadPaths(html)).toEqual(['assets/a.js']);
  });

  it('reads the href attribute of a link, not a data-href one', () => {
    const html = '<link rel="stylesheet" data-href="/assets/x.css" href="/assets/a.css">';
    expect(readInitialLoadPaths(html)).toEqual(['assets/a.css']);
  });

  it('keeps the valid tags next to malformed ones', () => {
    const html = [
      '<script src></script>',
      '<script src="/assets/a.js"></script>',
      '<link rel="stylesheet">',
      '<link rel="stylesheet" href="/assets/a.css">',
    ].join('');
    expect(readInitialLoadPaths(html)).toEqual(['assets/a.js', 'assets/a.css']);
  });

  it.each([
    ['an inline script', '<script>window.ready = true;</script>'],
    ['a module script without src', '<script type="module">import "/assets/a.js";</script>'],
    ['a script with an empty src', '<script src=""></script>'],
    ['a src without a value', '<script src></script>'],
    ['a src without quotes', '<script src=/assets/a.js></script>'],
    ['a src in single quotes', "<script src='/assets/a.js'></script>"],
    ['a data-src attribute', '<script data-src="/assets/a.js"></script>'],
    ['a data-href attribute', '<link rel="stylesheet" data-href="/assets/a.css">'],
    ['an unclosed script tag', '<script src="/assets/a.js"'],
    ['an external script', '<script src="https://example.com/a.js"></script>'],
    ['a link without rel', '<link href="/assets/a.css">'],
    ['a link without href', '<link rel="stylesheet">'],
    ['a link with an empty rel', '<link rel="" href="/assets/a.css">'],
    ['an icon', '<link rel="icon" href="/favicon.ico">'],
    ['a prefetch', '<link rel="prefetch" href="/assets/a.js">'],
    ['a stylesheet named outside rel', '<link title="stylesheet" href="/assets/a.css">'],
    ['an external style sheet', '<link rel="stylesheet" href="https://fonts.googleapis.com/css2">'],
    ['a commented-out script', '<!-- <script src="/assets/a.js"></script> -->'],
    ['a commented-out link', '<!--\n<link rel="stylesheet" href="/assets/a.css">\n-->'],
  ])('leaves out %s', (_, html) => {
    expect(readInitialLoadPaths(html)).toEqual([]);
  });

  it.each([undefined, null, '', 42, {}, ['<script src="/assets/a.js"></script>']])(
    'gives an empty list for %o',
    html => {
      expect(readInitialLoadPaths(html)).toEqual([]);
    },
  );
});
