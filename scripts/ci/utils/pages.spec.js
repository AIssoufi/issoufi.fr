import {
  comparePage,
  getPageChecks,
  isPageCheck,
  readPageHead,
  renderSmokeTestReport,
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

describe('getPageChecks', () => {
  it('maps each HTML file of the build to its route and status', () => {
    expect(getPageChecks(['index.html', 'projects.html', '404.html'])).toEqual([
      { file: 'index.html', route: '/', status: 200 },
      { file: 'projects.html', route: '/projects', status: 200 },
      { file: '404.html', route: '/smoke-test-page-that-does-not-exist', status: 404 },
    ]);
  });

  it('ignores the files that are not HTML pages', () => {
    expect(getPageChecks(['assets', 'chess.png', 'robots.txt', 'index.html.map'])).toEqual([]);
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
