import { formatVersion, getAncestorsInBody, getElementsOutside } from './utils.ts';

/**
 * Builds this page in the document body, and returns its elements by id:
 *
 * ```html
 * <a id="logo"></a>
 * <div id="actions">
 *   <button id="lang"></button>
 *   <div id="menu"><button id="burger"></button></div>
 * </div>
 * <main id="page"></main>
 * ```
 */
const buildPage = () => {
  document.body.innerHTML = `
    <a id="logo"></a>
    <div id="actions">
      <button id="lang"></button>
      <div id="menu"><button id="burger"></button></div>
    </div>
    <main id="page"></main>
  `;
  const byId = (id: string) => document.getElementById(id)!;

  return {
    logo: byId('logo'),
    actions: byId('actions'),
    lang: byId('lang'),
    menu: byId('menu'),
    burger: byId('burger'),
    page: byId('page'),
  };
};

describe('getAncestorsInBody', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('lists the ancestors from the parent up to the body', () => {
    const { actions, menu, burger } = buildPage();

    expect(getAncestorsInBody(burger)).toEqual([menu, actions, document.body]);
  });

  it('lists only the body for one of its children', () => {
    const { page } = buildPage();

    expect(getAncestorsInBody(page)).toEqual([document.body]);
  });

  it('returns an empty list for the body itself', () => {
    expect(getAncestorsInBody(document.body)).toEqual([]);
  });

  it('returns an empty list for the root element, which is outside the body', () => {
    expect(getAncestorsInBody(document.documentElement)).toEqual([]);
  });

  it('returns an empty list for a detached element', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.append(child);

    expect(getAncestorsInBody(child)).toEqual([]);
  });
});

describe('getElementsOutside', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('lists the other children of the parent and of each ancestor, closest first', () => {
    const { logo, lang, menu, page } = buildPage();

    expect(getElementsOutside(menu)).toEqual([lang, logo, page]);
  });

  it('leaves out the ancestors of the container and what it holds', () => {
    const { actions, menu, burger } = buildPage();

    const elementsOutside = getElementsOutside(menu);

    expect(elementsOutside).not.toContain(menu);
    expect(elementsOutside).not.toContain(actions);
    expect(elementsOutside).not.toContain(burger);
  });

  it('goes on above a container without siblings', () => {
    const { logo, lang, menu, burger, page } = buildPage();

    expect(getElementsOutside(burger)).toEqual([lang, logo, page]);
    expect(getElementsOutside(burger)).not.toContain(menu);
  });

  it('lists the other children of the body for one of its children', () => {
    const { logo, actions, page } = buildPage();

    expect(getElementsOutside(page)).toEqual([logo, actions]);
  });

  it('returns an empty list for the only element of the body', () => {
    document.body.innerHTML = '<div id="alone"></div>';

    expect(getElementsOutside(document.getElementById('alone')!)).toEqual([]);
  });

  it('ignores the text around the container', () => {
    document.body.innerHTML = 'Text <div id="menu"></div> more text';

    expect(getElementsOutside(document.getElementById('menu')!)).toEqual([]);
  });

  it('returns an empty list for the body itself', () => {
    buildPage();

    expect(getElementsOutside(document.body)).toEqual([]);
  });

  it('returns an empty list for a detached element', () => {
    const parent = document.createElement('div');
    const container = document.createElement('div');
    parent.append(container, document.createElement('span'));

    expect(getElementsOutside(container)).toEqual([]);
  });
});

describe('formatVersion', () => {
  it('writes the version after a v', () => {
    expect(formatVersion('1.0.0')).toBe('v1.0.0');
  });

  it.each([
    ['v1.0.0', 'v1.0.0'],
    ['V1.0.0', 'v1.0.0'],
    ['  1.0.0  ', 'v1.0.0'],
    [' v 1.0.0', 'v1.0.0'],
    ['2.0.0-beta.1', 'v2.0.0-beta.1'],
    ['10.20.30', 'v10.20.30'],
  ])('writes the version %j with a single v', (version, expected) => {
    expect(formatVersion(version)).toBe(expected);
  });

  describe('edge cases', () => {
    it.each([undefined, null, '', '   ', 'v', ' V ', 1, Number.NaN, {}, ['1.0.0']])(
      'returns an empty text for the version %j',
      version => {
        expect(formatVersion(version as never)).toBe('');
      },
    );

    it('returns an empty text without a version', () => {
      expect(formatVersion()).toBe('');
    });
  });
});
