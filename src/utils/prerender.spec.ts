import {
  APP_CONTAINER_ID,
  canHydrate,
  PRERENDERED_PATH_ATTRIBUTE,
  removeLeadingLinks,
} from './prerender.ts';

describe('removeLeadingLinks', () => {
  it('removes the links that preload the images before the page', () => {
    const html =
      '<link rel="preload" as="image" href="/a.webp"/><link rel="preload" as="image" imageSrcSet="/b-480.webp 480w"/><main>…</main>';

    expect(removeLeadingLinks(html)).toBe('<main>…</main>');
  });

  it('keeps the links inside the page, and the page without a leading link', () => {
    const html = '<main><link rel="stylesheet" href="/a.css"/></main>';

    expect(removeLeadingLinks(html)).toBe(html);
  });

  it('keeps a page that only starts with a tag of a similar name', () => {
    expect(removeLeadingLinks('<linkish></linkish>')).toBe('<linkish></linkish>');
  });

  it.each([undefined, null, 42, {}, ['<link/>']])(
    'returns an empty string for %j, which is not a string',
    html => {
      expect(removeLeadingLinks(html)).toBe('');
    },
  );

  it('returns an empty page as it is', () => {
    expect(removeLeadingLinks('')).toBe('');
  });
});

describe('canHydrate', () => {
  /** Builds the container of the app, holding `html`, rendered at `path` when it is given. */
  const createContainer = ({ path, html = '<main></main>' }: { path?: string; html?: string }) => {
    const container = document.createElement('div');
    container.id = APP_CONTAINER_ID;
    if (path !== undefined) container.setAttribute(PRERENDERED_PATH_ATTRIBUTE, path);
    container.innerHTML = html;
    return container;
  };

  it('is true for a page rendered at the current path', () => {
    const container = createContainer({ path: '/en/projects' });

    expect(canHydrate({ container, pathname: '/en/projects' })).toBe(true);
  });

  it('is false at another path, as at the root URL taking the visitor to their language', () => {
    const container = createContainer({ path: '/' });

    expect(canHydrate({ container, pathname: '/en/' })).toBe(false);
  });

  it('is false for a not found page, rendered at no path of its own', () => {
    expect(canHydrate({ container: createContainer({}), pathname: '/unknown' })).toBe(false);
  });

  it('is false for an empty container, as in the dev server and the standalone build', () => {
    const container = createContainer({ path: '/', html: '' });

    expect(canHydrate({ container, pathname: '/' })).toBe(false);
  });

  it('compares the paths exactly, without a trailing slash nor a case of its own', () => {
    expect(canHydrate({ container: createContainer({ path: '/en/' }), pathname: '/en' })).toBe(
      false,
    );
    expect(
      canHydrate({ container: createContainer({ path: '/projects' }), pathname: '/Projects' }),
    ).toBe(false);
  });

  it.each([
    ['no parameters', undefined],
    ['no container', { pathname: '/' }],
    ['a null container, as when the document has none', { container: null, pathname: '/' }],
  ])('is false with %s', (_, params) => {
    expect(canHydrate(params)).toBe(false);
  });

  it('is false without a path', () => {
    expect(canHydrate({ container: createContainer({ path: '/' }) })).toBe(false);
  });
});
