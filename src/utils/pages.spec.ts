import { readFileSync } from 'node:fs';

import { PAGES, getPage, renderNotFoundHtml, renderPageHtml } from './pages';

const [home, projects, experiences] = PAGES;

describe('getPage', () => {
  it('finds the page matching the path', () => {
    expect(getPage('/')).toBe(home);
    expect(getPage('/projects')).toBe(projects);
    expect(getPage('/experiences')).toBe(experiences);
  });

  it('ignores a trailing slash', () => {
    expect(getPage('/projects/')).toBe(projects);
  });

  it('returns undefined for unknown paths', () => {
    expect(getPage('/skills')).toBeUndefined();
    expect(getPage('/projects/inconnu')).toBeUndefined();
  });
});

describe('renderPageHtml', () => {
  const template =
    '<title>%PAGE_TITLE%</title><meta content="%PAGE_DESCRIPTION%"><link href="%PAGE_URL%">';

  it('fills the home page metadata with the years of experience', () => {
    expect(renderPageHtml({ template, page: home, years: 8 })).toBe(
      '<title>ADAM Issoufi - Développeur full-stack JavaScript</title>' +
        '<meta content="Développeur full-stack JavaScript avec 8 ans d\'expérience, spécialisé React.">' +
        '<link href="https://issoufi.fr/">',
    );
  });

  it('fills the metadata and URL of the other pages', () => {
    expect(renderPageHtml({ template, page: projects, years: 8 })).toBe(
      '<title>Projets - ADAM Issoufi</title>' +
        '<meta content="Projets personnels et freelance d\'ADAM Issoufi, développeur full-stack JavaScript.">' +
        '<link href="https://issoufi.fr/projects">',
    );
    expect(renderPageHtml({ template, page: experiences, years: 8 })).toContain(
      '<link href="https://issoufi.fr/experiences">',
    );
  });

  it('fills every placeholder of index.html for every page', () => {
    const html = readFileSync('index.html', 'utf-8');

    expect(html.match(/%PAGE_TITLE%/g)).toHaveLength(3);
    expect(html.match(/%PAGE_DESCRIPTION%/g)).toHaveLength(3);
    expect(html.match(/%PAGE_URL%/g)).toHaveLength(2);
    PAGES.forEach(page =>
      expect(renderPageHtml({ template: html, page, years: 8 })).not.toMatch(/%PAGE_\w+%/),
    );
  });
});

describe('renderNotFoundHtml', () => {
  const html = readFileSync('index.html', 'utf-8');

  it('uses the not found title and description', () => {
    const page = renderNotFoundHtml({ template: html, years: 8 });

    expect(page).toContain('<title>Page introuvable - ADAM Issoufi</title>');
    expect(page).toContain('content="Cette page n\'existe pas."');
    expect(page).not.toMatch(/%PAGE_\w+%/);
  });

  it('is not indexed and has no canonical URL or og:url', () => {
    const page = renderNotFoundHtml({ template: html, years: 8 });

    expect(page).toContain('<meta name="robots" content="noindex" />');
    expect(page).not.toContain('rel="canonical"');
    expect(page).not.toContain('og:url');
    expect(page.indexOf('noindex')).toBeLessThan(page.indexOf('</head>'));
  });

  it('keeps the rest of the template, such as the app script', () => {
    const page = renderNotFoundHtml({ template: html, years: 8 });

    expect(page).toContain('src="/src/index.tsx"');
    expect(page).toContain('property="og:image"');
  });

  describe('edge cases', () => {
    it('does not fail on a template without canonical, og:url or head', () => {
      expect(renderNotFoundHtml({ template: '<p>%PAGE_TITLE%</p>', years: 8 })).toBe(
        '<p>Page introuvable - ADAM Issoufi</p>',
      );
    });

    it('returns an empty string for an empty template', () => {
      expect(renderNotFoundHtml({ template: '', years: 8 })).toBe('');
    });
  });
});

describe('renderPageHtml edge cases', () => {
  it('keeps apostrophes as they are, since attributes use double quotes', () => {
    const page = renderPageHtml({ template: '%PAGE_DESCRIPTION%', page: PAGES[1], years: 8 });

    expect(page).toBe(
      "Projets personnels et freelance d'ADAM Issoufi, développeur full-stack JavaScript.",
    );
  });

  it('leaves a template without placeholders unchanged', () => {
    expect(renderPageHtml({ template: '<p>static</p>', page: PAGES[0], years: 8 })).toBe(
      '<p>static</p>',
    );
  });
});
