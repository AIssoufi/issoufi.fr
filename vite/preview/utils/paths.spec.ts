// @vitest-environment node
import { getNotFoundPageFiles, getRequestPathname, getServedFiles } from './paths.ts';

describe('getRequestPathname', () => {
  it('reads the path of a URL', () => {
    expect(getRequestPathname('/en/projects')).toBe('/en/projects');
    expect(getRequestPathname('/')).toBe('/');
  });

  it('drops the query and the fragment', () => {
    expect(getRequestPathname('/projects?a=1&b=2')).toBe('/projects');
    expect(getRequestPathname('/projects#top')).toBe('/projects');
    expect(getRequestPathname('/projects?a=1#top')).toBe('/projects');
    expect(getRequestPathname('/?')).toBe('/');
  });

  it('decodes the path', () => {
    expect(getRequestPathname('/projets/un%20lien?a=1')).toBe('/projets/un lien');
    expect(getRequestPathname('/%C3%A9t%C3%A9')).toBe('/été');
  });

  it('ignores a path that does not decode', () => {
    expect(getRequestPathname('/%E0%A4%A')).toBeUndefined();
    expect(getRequestPathname('/%')).toBeUndefined();
  });

  it('ignores a URL that does not start with a slash', () => {
    expect(getRequestPathname('*')).toBeUndefined();
    expect(getRequestPathname('http://localhost/projects')).toBeUndefined();
    expect(getRequestPathname('')).toBeUndefined();
  });

  it('ignores a value that is not a string', () => {
    expect(getRequestPathname(undefined)).toBeUndefined();
    expect(getRequestPathname(null)).toBeUndefined();
    expect(getRequestPathname(404)).toBeUndefined();
    expect(getRequestPathname(['/projects'])).toBeUndefined();
  });
});

describe('getServedFiles', () => {
  it('lists the file, the page and the folder index of a path', () => {
    expect(getServedFiles('/projects')).toEqual([
      'projects',
      'projects.html',
      'projects/index.html',
    ]);
    expect(getServedFiles('/en/404.html')).toEqual([
      'en/404.html',
      'en/404.html.html',
      'en/404.html/index.html',
    ]);
  });

  it('lists the folder index and the page of a path with a trailing slash', () => {
    expect(getServedFiles('/en/')).toEqual(['en/index.html', 'en.html']);
    expect(getServedFiles('/en/projects/')).toEqual(['en/projects/index.html', 'en/projects.html']);
  });

  it('lists the index of the root alone', () => {
    expect(getServedFiles('/')).toEqual(['index.html']);
  });

  it('keeps the empty segments of a path', () => {
    expect(getServedFiles('//')).toEqual(['/index.html', '.html']);
  });
});

describe('getNotFoundPageFiles', () => {
  it('lists the not found page of the root for a path at the root', () => {
    expect(getNotFoundPageFiles('/nope')).toEqual(['404.html']);
    expect(getNotFoundPageFiles('/')).toEqual(['404.html']);
  });

  it('lists the not found page of each folder, the closest first', () => {
    expect(getNotFoundPageFiles('/en/nope')).toEqual(['en/404.html', '404.html']);
    expect(getNotFoundPageFiles('/en/a/b')).toEqual(['en/a/404.html', 'en/404.html', '404.html']);
  });

  it('counts the folder of a trailing slash', () => {
    expect(getNotFoundPageFiles('/en/')).toEqual(['en/404.html', '404.html']);
  });
});
