import { INTERACTIVE_SELECTOR, declaredStyle, isPublicFile, listStyleRules } from './testUtils';

describe('INTERACTIVE_SELECTOR', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('matches the elements that take a click or the focus, and only them', () => {
    document.body.innerHTML = `
      <a href="/projects">link</a><button>button</button><input /><select></select>
      <textarea></textarea><div tabindex="-1">focusable</div>
      <a>anchor without href</a><span>text</span><img alt="" />`;

    const matches = [...document.querySelectorAll(INTERACTIVE_SELECTOR)].map(
      element => element.textContent || element.tagName,
    );
    expect(matches).toEqual(['link', 'button', 'INPUT', 'SELECT', 'TEXTAREA', 'focusable']);
  });
});

describe('isPublicFile', () => {
  it('takes an absolute URL naming a file of public/', () => {
    expect(isPublicFile('/robots.txt')).toBe(true);
  });

  it('does not take a missing file or a folder', () => {
    expect(isPublicFile('/missing-screenshot.webp')).toBe(false);
    expect(isPublicFile('')).toBe(false);
    expect(isPublicFile('/')).toBe(false);
  });

  it('only takes absolute URLs that stay inside public/', () => {
    expect(isPublicFile('robots.txt')).toBe(false);
    expect(isPublicFile('/../package.json')).toBe(false);
    expect(isPublicFile(undefined)).toBe(false);
    expect(isPublicFile(null)).toBe(false);
    expect(isPublicFile(42)).toBe(false);
  });
});

describe('declaredStyle', () => {
  const TABLET_MEDIA = '(min-width: 50em)';

  /** Adds a stylesheet to the document and returns an element holding the given class. */
  const setUp = ({ css, className = 'card' }) => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
    const element = document.createElement('div');
    element.className = className;
    document.body.append(element);
    return element;
  };

  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('reads a declaration outside media queries, then inside the given one', () => {
    const element = setUp({
      css: `.card { padding-left: 19px; } @media ${TABLET_MEDIA} { .card { padding-left: 0; } }`,
    });

    expect(declaredStyle({ element, property: 'padding-left' })).toBe('19px');
    expect(declaredStyle({ element, property: 'padding-left', media: TABLET_MEDIA })).toBe('0');
  });

  it('keeps the last declaration of the property', () => {
    const element = setUp({ css: '.card { margin: 5px; } .card { margin: 8px; }' });

    expect(declaredStyle({ element, property: 'margin' })).toBe('8px');
  });

  it('returns an empty string when no rule of the element declares the property', () => {
    const element = setUp({ css: '.other { margin: 5px; } .card { display: grid; }' });

    expect(declaredStyle({ element, property: 'margin' })).toBe('');
    expect(declaredStyle({ element, property: 'display', media: TABLET_MEDIA })).toBe('');
    expect(declaredStyle({ element: setUp({ css: '', className: '' }), property: 'margin' })).toBe(
      '',
    );
  });

  it('reads the rules of the given pseudo-element or state apart from those of the element', () => {
    const element = setUp({
      css: `.card { position: relative; } .card::after { position: absolute; }
        .card::before { position: fixed; } .card:focus-visible::after { position: static; }`,
    });

    expect(declaredStyle({ element, property: 'position' })).toBe('relative');
    expect(declaredStyle({ element, property: 'position', pseudo: '::after' })).toBe('absolute');
    expect(declaredStyle({ element, property: 'position', pseudo: ':focus-visible::after' })).toBe(
      'static',
    );
    expect(declaredStyle({ element, property: 'position', pseudo: '::marker' })).toBe('');
    expect(declaredStyle({ element, property: 'position', pseudo: undefined })).toBe('relative');
    expect(declaredStyle({ element, property: 'position', pseudo: null })).toBe('');
    expect(declaredStyle({ element, property: 'position', pseudo: 42 })).toBe('');
  });

  it('returns an empty string for a missing element or property', () => {
    setUp({ css: '.card { margin: 5px; }' });

    expect(declaredStyle()).toBe('');
    expect(declaredStyle({ property: 'margin' })).toBe('');
    expect(declaredStyle({ element: null, property: 'margin' })).toBe('');
    expect(declaredStyle({ element: {}, property: 'margin' })).toBe('');
    expect(declaredStyle({ element: document.querySelector('.card') })).toBe('');
    expect(declaredStyle({ element: document.querySelector('.card'), property: 42 })).toBe('');
  });
});

describe('listStyleRules', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('lists the rules of every stylesheet, with the condition of their media query', () => {
    const style = document.createElement('style');
    style.textContent = '.a { margin: 0; } @media (min-width: 50em) { .b { margin: 1px; } }';
    document.head.append(style);

    const rules = listStyleRules().map(({ media, rule }) => [media, rule.selectorText]);
    expect(rules).toEqual([
      ['', '.a'],
      ['(min-width: 50em)', '.b'],
    ]);
  });

  it('lists nothing without stylesheets', () => {
    expect(listStyleRules()).toEqual([]);
  });
});
