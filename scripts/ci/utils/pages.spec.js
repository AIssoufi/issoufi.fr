import { comparePage, getPageChecks, readPageHead } from './pages.mjs';

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

  it.each([undefined, []])('gives no check for %s', fileNames => {
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

  it('reports a missing served page as an empty one', () => {
    expect(comparePage({ page, status: 200, builtHtml })).toEqual([
      '/projects: title "" instead of "Projets - ADAM Issoufi"',
      '/projects: canonical "" instead of "https://issoufi.fr/projects"',
    ]);
  });
});
