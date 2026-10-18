import { SITEMAP_FILE_NAME } from '../../../src/utils/sitemap';
import { SITE_URL } from '../constants.mjs';
import {
  compareFile,
  comparePage,
  getFileChecks,
  getPageChecks,
  isPageCheck,
  readPageHead,
  renderSmokeTestReport,
  resolveSiteUrl,
  splitBuildPath,
} from './pages.mjs';

describe('isPageCheck', () => {
  it.each([
    { file: 'index.html', route: '/', status: 200 },
    { file: '404.html', route: '/smoke-test-page-that-does-not-exist', status: 404 },
  ])('accepts %o', value => {
    expect(isPageCheck(value)).toBe(true);
  });

  it.each([
    undefined,
    null,
    'index.html',
    42,
    [],
    {},
    { route: '/', status: 200 },
    { file: 'index.html', status: 200 },
    { file: 'index.html', route: '/' },
    { file: 'index.html', route: '/', status: '200' },
    { file: 'index.html', route: '/', status: NaN },
    { file: 'index.html', route: '/', status: Infinity },
    { file: 'index.html', route: '/', status: 200.5 },
    { file: 42, route: '/', status: 200 },
    { file: '', route: '/', status: 200 },
    { file: 'index.html', route: '', status: 200 },
  ])('rejects %o', value => {
    expect(isPageCheck(value)).toBe(false);
  });
});

describe('splitBuildPath', () => {
  it.each([
    ['index.html', '', 'index.html'],
    ['404.html', '', '404.html'],
    ['en/projects.html', '/en', 'projects.html'],
    ['en/index.html', '/en', 'index.html'],
    ['a/b/page.html', '/a/b', 'page.html'],
  ])('splits %j into the folder route %j and the name %j', (file, folderRoute, name) => {
    expect(splitBuildPath(file)).toEqual({ folderRoute, name });
  });

  it('gives an empty name to a path that ends with a separator', () => {
    expect(splitBuildPath('en/')).toEqual({ folderRoute: '/en', name: '' });
  });

  it('gives an empty folder route and name to an empty path', () => {
    expect(splitBuildPath('')).toEqual({ folderRoute: '', name: '' });
  });
});

describe('getPageChecks', () => {
  it('maps each HTML file of the build to its route and status', () => {
    expect(getPageChecks(['index.html', 'projects.html', '404.html'])).toEqual([
      { file: 'index.html', route: '/', status: 200 },
      { file: 'projects.html', route: '/projects', status: 200 },
      { file: '404.html', route: '/smoke-test-page-that-does-not-exist', status: 404 },
    ]);
  });

  it('maps the pages of a language folder to the routes of its prefix', () => {
    expect(
      getPageChecks(['en/index.html', 'en/projects.html', 'en/experiences.html', 'en/404.html']),
    ).toEqual([
      { file: 'en/index.html', route: '/en/', status: 200 },
      { file: 'en/projects.html', route: '/en/projects', status: 200 },
      { file: 'en/experiences.html', route: '/en/experiences', status: 200 },
      { file: 'en/404.html', route: '/en/smoke-test-page-that-does-not-exist', status: 404 },
    ]);
  });

  it('maps a page of nested folders to the route of its folders', () => {
    expect(getPageChecks(['a/b/index.html', 'a/b/page.html', 'a/b/404.html'])).toEqual([
      { file: 'a/b/index.html', route: '/a/b/', status: 200 },
      { file: 'a/b/page.html', route: '/a/b/page', status: 200 },
      { file: 'a/b/404.html', route: '/a/b/smoke-test-page-that-does-not-exist', status: 404 },
    ]);
  });

  it('reads the paths that Node.js lists with backslashes on Windows', () => {
    expect(getPageChecks(['en\\projects.html'])).toEqual([
      { file: 'en/projects.html', route: '/en/projects', status: 200 },
    ]);
  });

  it('ignores the files that are not HTML pages', () => {
    expect(
      getPageChecks([
        'assets',
        'assets/index-B7cJ.js',
        'chess.png',
        'robots.txt',
        'index.html.map',
      ]),
    ).toEqual([]);
  });

  it.each([undefined, null, [], 'index.html', {}])('gives no check for %o', fileNames => {
    expect(getPageChecks(fileNames)).toEqual([]);
  });

  it('ignores entries that are not file names', () => {
    expect(getPageChecks([null, 42, { name: 'index.html' }, 'index.html'])).toEqual([
      { file: 'index.html', route: '/', status: 200 },
    ]);
  });
});

describe('readPageHead', () => {
  it('reads the title and the canonical URL across line breaks', () => {
    const html = `<head>
      <title> Projets - ADAM Issoufi </title>
      <link
        rel="canonical"
        href="https://issoufi.fr/projects"
      />
    </head>`;
    expect(readPageHead(html)).toEqual({
      title: 'Projets - ADAM Issoufi',
      canonical: 'https://issoufi.fr/projects',
    });
  });

  it('reads a canonical link whose href comes first', () => {
    const html = '<link href="https://issoufi.fr/" rel="canonical">';
    expect(readPageHead(html).canonical).toBe('https://issoufi.fr/');
  });

  it('reads the href attribute, not a data-href one', () => {
    const html =
      '<link rel="canonical" data-href="https://example.com/" href="https://issoufi.fr/">';
    expect(readPageHead(html).canonical).toBe('https://issoufi.fr/');
  });

  it('ignores the other links', () => {
    const html = '<link rel="icon" href="/favicon.ico" /><title>Home</title>';
    expect(readPageHead(html)).toEqual({ title: 'Home', canonical: '' });
  });

  it.each([undefined, null, 42, '', '<html></html>'])('gives empty values for %s', html => {
    expect(readPageHead(html)).toEqual({ title: '', canonical: '' });
  });
});

describe('comparePage', () => {
  const page = { file: 'projects.html', route: '/projects', status: 200 };
  const builtHtml =
    '<title>Projets - ADAM Issoufi</title><link rel="canonical" href="https://issoufi.fr/projects" />';

  it('finds no problem when the page is served as built', () => {
    expect(comparePage({ page, status: 200, servedHtml: builtHtml, builtHtml })).toEqual([]);
  });

  it('reports an unexpected status', () => {
    expect(comparePage({ page, status: 404, servedHtml: builtHtml, builtHtml })).toEqual([
      '/projects: status 404 instead of 200',
    ]);
  });

  it('reports another title and another canonical URL', () => {
    const servedHtml =
      '<title>Page introuvable - ADAM Issoufi</title><link rel="canonical" href="https://issoufi.fr/" />';
    expect(comparePage({ page, status: 200, servedHtml, builtHtml })).toEqual([
      '/projects: title "Page introuvable - ADAM Issoufi" instead of "Projets - ADAM Issoufi"',
      '/projects: canonical "https://issoufi.fr/" instead of "https://issoufi.fr/projects"',
    ]);
  });

  it('reports a built page without a title, even when the served page has none either', () => {
    expect(comparePage({ page, status: 200, servedHtml: '', builtHtml: '' })).toEqual([
      '/projects: projects.html has no title in the build',
    ]);
  });

  it.each([undefined, null, {}, { route: '/projects', status: 200 }])(
    'reports the missing or malformed page %o as a single problem',
    malformedPage => {
      expect(
        comparePage({ page: malformedPage, status: 200, servedHtml: builtHtml, builtHtml }),
      ).toEqual(['A page check without a file, a route or an integer status cannot be compared']);
    },
  );

  it.each([undefined, null, NaN, Infinity, 200.5, '200'])(
    'reports the served status %o as unknown',
    status => {
      expect(comparePage({ page, status, servedHtml: builtHtml, builtHtml })).toEqual([
        '/projects: status unknown instead of 200',
      ]);
    },
  );

  it('reports a missing served page as an empty one', () => {
    expect(comparePage({ page, status: 200, builtHtml })).toEqual([
      '/projects: title "" instead of "Projets - ADAM Issoufi"',
      '/projects: canonical "" instead of "https://issoufi.fr/projects"',
    ]);
  });
});

describe('getFileChecks', () => {
  it('checks robots.txt and sitemap.xml at the root of the site', () => {
    expect(getFileChecks(['index.html', 'sitemap.xml', 'assets/index.js', 'robots.txt'])).toEqual([
      { file: 'robots.txt', route: '/robots.txt', status: 200 },
      { file: 'sitemap.xml', route: '/sitemap.xml', status: 200 },
    ]);
  });

  it('checks the sitemap under the name the build writes it with', () => {
    expect(getFileChecks([SITEMAP_FILE_NAME])).toEqual([
      { file: SITEMAP_FILE_NAME, route: `/${SITEMAP_FILE_NAME}`, status: 200 },
    ]);
  });

  it('gives no check for a file that the build does not have', () => {
    expect(getFileChecks(['index.html', 'robots.txt'])).toEqual([
      { file: 'robots.txt', route: '/robots.txt', status: 200 },
    ]);
  });

  it('gives no check for a file that the build has only in a folder', () => {
    expect(getFileChecks(['en/sitemap.xml', 'en\\robots.txt'])).toEqual([]);
  });

  it('ignores the other files and the entries that are not file names', () => {
    expect(
      getFileChecks(['favicon.ico', 'manifest.json', null, 42, { name: 'robots.txt' }]),
    ).toEqual([]);
  });

  it.each([undefined, null, [], 'robots.txt', {}])('gives no check for %o', fileNames => {
    expect(getFileChecks(fileNames)).toEqual([]);
  });
});

describe('compareFile', () => {
  const check = { file: 'sitemap.xml', route: '/sitemap.xml', status: 200 };
  const builtText = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset></urlset>\n';

  it('finds no problem when the file is served as built', () => {
    expect(compareFile({ check, status: 200, servedText: builtText, builtText })).toEqual([]);
  });

  it('reports an unexpected status', () => {
    expect(compareFile({ check, status: 404, servedText: builtText, builtText })).toEqual([
      '/sitemap.xml: status 404 instead of 200',
    ]);
  });

  it('reports a content that differs from the build, by a single character', () => {
    const servedText = builtText.replace('\n<urlset>', '<urlset>');

    expect(compareFile({ check, status: 200, servedText, builtText })).toEqual([
      '/sitemap.xml: content differs from sitemap.xml of the build',
    ]);
  });

  it('reports the not found page served in place of the file, with both problems', () => {
    const servedText = '<!doctype html><title>Page introuvable</title>';

    expect(compareFile({ check, status: 404, servedText, builtText })).toEqual([
      '/sitemap.xml: status 404 instead of 200',
      '/sitemap.xml: content differs from sitemap.xml of the build',
    ]);
  });

  it.each([undefined, null, 42, ''])(
    'reports a file empty in the build, %o, even when the site serves it empty too',
    emptyText => {
      expect(compareFile({ check, status: 200, servedText: '', builtText: emptyText })).toEqual([
        '/sitemap.xml: sitemap.xml is empty in the build',
      ]);
    },
  );

  it.each([undefined, null, 42])('reports the served content %o as differing', servedText => {
    expect(compareFile({ check, status: 200, servedText, builtText })).toEqual([
      '/sitemap.xml: content differs from sitemap.xml of the build',
    ]);
  });

  it.each([undefined, null, NaN, 200.5, '200'])(
    'reports the served status %o as unknown',
    status => {
      expect(compareFile({ check, status, servedText: builtText, builtText })).toEqual([
        '/sitemap.xml: status unknown instead of 200',
      ]);
    },
  );

  it.each([undefined, null, {}, { route: '/sitemap.xml', status: 200 }])(
    'reports the missing or malformed file check %o as a single problem',
    malformedCheck => {
      expect(
        compareFile({ check: malformedCheck, status: 200, servedText: builtText, builtText }),
      ).toEqual(['A file check without a file, a route or an integer status cannot be compared']);
    },
  );
});

describe('resolveSiteUrl', () => {
  it('checks the production site when the command has no argument', () => {
    expect(resolveSiteUrl(undefined)).toBe(SITE_URL);
  });

  it.each(['https://develop.issoufi-fr.pages.dev', 'https://issoufi.fr', 'not a URL'])(
    'keeps the argument %o as given',
    argument => {
      expect(resolveSiteUrl(argument)).toBe(argument);
    },
  );

  // An unset deployment URL must fail the smoke test, not check production in place of a preview
  it.each(['', ' '])('keeps the empty argument %o rather than checking production', argument => {
    expect(resolveSiteUrl(argument)).toBe(argument);
  });

  it.each([null, 42, {}, ['https://issoufi.fr/']])('gives no site for %o', argument => {
    expect(resolveSiteUrl(argument)).toBe('');
  });
});

describe('renderSmokeTestReport', () => {
  const siteUrl = 'https://issoufi.fr';
  const pages = [
    { file: 'index.html', route: '/', status: 200 },
    { file: '404.html', route: '/smoke-test-page-that-does-not-exist', status: 404 },
  ];

  it('lists the routes served as built', () => {
    expect(renderSmokeTestReport({ siteUrl, pages })).toBe(
      '## Smoke test\n\n✅ https://issoufi.fr serves `/` (200), `/smoke-test-page-that-does-not-exist` (404) as built.\n',
    );
  });

  it('lists the files served as built after the pages', () => {
    const files = getFileChecks(['sitemap.xml']);

    expect(renderSmokeTestReport({ siteUrl, pages: [pages[0], ...files] })).toBe(
      '## Smoke test\n\n✅ https://issoufi.fr serves `/` (200), `/sitemap.xml` (200) as built.\n',
    );
  });

  it('lists the problems instead of the routes', () => {
    const problems = ['/: status 500 instead of 200', '/: title "" instead of "Accueil"'];
    expect(renderSmokeTestReport({ siteUrl, pages, problems })).toBe(
      [
        '## Smoke test',
        '',
        '❌ https://issoufi.fr:',
        '',
        '- /: status 500 instead of 200',
        '- /: title "" instead of "Accueil"',
        '',
      ].join('\n'),
    );
  });

  it.each([undefined, null, [], {}])('reports a failure when the pages are %o', pagesToCheck => {
    expect(renderSmokeTestReport({ siteUrl, pages: pagesToCheck })).toBe(
      '## Smoke test\n\n❌ https://issoufi.fr: no page of the build was checked.\n',
    );
  });

  it('leaves out the entries that are not page checks', () => {
    const report = renderSmokeTestReport({
      siteUrl,
      pages: [
        null,
        {},
        { file: 'projects.html', route: 42, status: 200 },
        { file: 'projects.html', route: '/projects' },
        { file: 'projects.html', route: '/projects', status: '200' },
        { file: 'projects.html', route: '/projects', status: NaN },
        { route: '/projects', status: 200 },
        pages[0],
      ],
    });
    expect(report).toBe('## Smoke test\n\n✅ https://issoufi.fr serves `/` (200) as built.\n');
  });

  it.each([undefined, null, {}])('reports a success when the problems are %o', problems => {
    expect(renderSmokeTestReport({ siteUrl, pages: [pages[0]], problems })).toBe(
      '## Smoke test\n\n✅ https://issoufi.fr serves `/` (200) as built.\n',
    );
  });

  it('leaves out the problems that are not text', () => {
    expect(renderSmokeTestReport({ siteUrl, pages, problems: [null, 42, '/: failed'] })).toBe(
      '## Smoke test\n\n❌ https://issoufi.fr:\n\n- /: failed\n',
    );
    expect(renderSmokeTestReport({ siteUrl, pages, problems: [null] })).toContain('✅');
  });

  it.each([undefined, null, '', 42, { href: siteUrl }])('leaves the site URL %o empty', url => {
    expect(renderSmokeTestReport({ siteUrl: url, pages: [pages[0]] })).toBe(
      '## Smoke test\n\n✅  serves `/` (200) as built.\n',
    );
  });

  it('reports a failure when no entry is a page check', () => {
    expect(renderSmokeTestReport({ siteUrl, pages: [{ route: '/' }] })).toBe(
      '## Smoke test\n\n❌ https://issoufi.fr: no page of the build was checked.\n',
    );
  });
});
