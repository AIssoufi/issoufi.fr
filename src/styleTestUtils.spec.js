import { declaredStyle, listStyleRules, serializeCssValue } from './styleTestUtils';

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
    expect(declaredStyle({ element, property: 'padding-left', media: TABLET_MEDIA })).toBe('0px');
  });

  it('returns the value as the CSSOM serializes it, like a browser', () => {
    const element = setUp({ css: '.card { inset: 0; padding-left: calc(24px - 5px); }' });

    expect(declaredStyle({ element, property: 'inset' })).toBe('0px');
    expect(declaredStyle({ element, property: 'padding-left' })).toBe('calc(19px)');
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

describe('serializeCssValue', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('serializes a value as the CSSOM does, like a browser', () => {
    expect(serializeCssValue({ property: 'inset', value: '0' })).toBe('0px');
    expect(serializeCssValue({ property: 'padding-left', value: 'calc(24px - 5px)' })).toBe(
      'calc(19px)',
    );
    expect(serializeCssValue({ property: 'width', value: 'calc(100% - 2rem)' })).toBe(
      'calc(100% - 2rem)',
    );
    expect(serializeCssValue({ property: 'display', value: 'flex' })).toBe('flex');
  });

  it('serializes the value declared by a rule the same way', () => {
    const style = document.createElement('style');
    style.textContent = '.card { padding-left: calc(24px - 5px); }';
    document.head.append(style);
    const card = document.createElement('div');
    card.className = 'card';

    expect(declaredStyle({ element: card, property: 'padding-left' })).toBe(
      serializeCssValue({ property: 'padding-left', value: 'calc(24px - 5px)' }),
    );
  });

  it('returns an empty string for a value the property does not accept', () => {
    expect(serializeCssValue({ property: 'padding-left', value: 'red' })).toBe('');
    expect(serializeCssValue({ property: 'padding-left', value: '' })).toBe('');
    expect(serializeCssValue({ property: 'unknown-property', value: '0' })).toBe('');
  });

  it('returns an empty string for a missing property or value, or one that is not a string', () => {
    expect(serializeCssValue()).toBe('');
    expect(serializeCssValue({ value: '0' })).toBe('');
    expect(serializeCssValue({ property: 'inset' })).toBe('');
    expect(serializeCssValue({ property: 'inset', value: null })).toBe('');
    expect(serializeCssValue({ property: 'inset', value: 0 })).toBe('');
    expect(serializeCssValue({ property: 42, value: '0' })).toBe('');
  });
});
