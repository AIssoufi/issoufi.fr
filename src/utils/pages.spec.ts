import { readFileSync } from 'node:fs';

import { PAGES, getPage, renderPageHtml } from './pages';

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
    expect(renderPageHtml(template, home, 8)).toBe(
      '<title>ADAM Issoufi - Développeur full-stack JavaScript</title>' +
        '<meta content="Développeur full-stack JavaScript avec 8 ans d\'expérience, spécialisé React.">' +
        '<link href="https://issoufi.fr/">',
    );
  });

  it('fills the metadata and URL of the other pages', () => {
    expect(renderPageHtml(template, projects, 8)).toBe(
      '<title>Projets - ADAM Issoufi</title>' +
        '<meta content="Projets personnels et freelance d\'ADAM Issoufi, développeur full-stack JavaScript.">' +
        '<link href="https://issoufi.fr/projects">',
    );
    expect(renderPageHtml(template, experiences, 8)).toContain(
      '<link href="https://issoufi.fr/experiences">',
    );
  });

  it('fills every placeholder of index.html for every page', () => {
    const html = readFileSync('index.html', 'utf-8');

    expect(html.match(/%PAGE_TITLE%/g)).toHaveLength(3);
    expect(html.match(/%PAGE_DESCRIPTION%/g)).toHaveLength(3);
    expect(html.match(/%PAGE_URL%/g)).toHaveLength(2);
    PAGES.forEach(page => expect(renderPageHtml(html, page, 8)).not.toMatch(/%PAGE_\w+%/));
  });
});
