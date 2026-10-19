import {
  blendColors,
  declaredStyle,
  getContrastRatio,
  listStyleRules,
  parseColor,
  serializeCssValue,
} from './styleTestUtils';

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

  it('reads the rules of a child, however the combinator is spaced', () => {
    const element = setUp({
      css: `.card >svg { stroke: red; } .card:hover> svg { stroke: blue; }
        .card svg { fill: green; }`,
    });

    expect(declaredStyle({ element, property: 'stroke', pseudo: ' > svg' })).toBe('red');
    expect(declaredStyle({ element, property: 'stroke', pseudo: '>svg' })).toBe('red');
    expect(declaredStyle({ element, property: 'stroke', pseudo: ':hover > svg' })).toBe('blue');
    // A descendant is not a child
    expect(declaredStyle({ element, property: 'fill', pseudo: ' > svg' })).toBe('');
  });

  it('keeps whole the selectors whose function holds a comma', () => {
    const element = setUp({
      css: '.card:is(:hover, :focus-visible) >svg, .other { stroke: red; }',
    });

    expect(
      declaredStyle({ element, property: 'stroke', pseudo: ':is(:hover, :focus-visible) > svg' }),
    ).toBe('red');
    expect(declaredStyle({ element, property: 'stroke', pseudo: ':is(:hover' })).toBe('');
  });

  it('reads a rule whose selector list holds the selector among others', () => {
    const element = setUp({
      css: `@media ${TABLET_MEDIA} { .card >svg,.card:hover>svg { stroke: red; } }
        @keyframes pop { from { opacity: 0; } }`,
    });

    expect(
      declaredStyle({ element, property: 'stroke', media: TABLET_MEDIA, pseudo: '>svg' }),
    ).toBe('red');
    expect(
      declaredStyle({ element, property: 'stroke', media: TABLET_MEDIA, pseudo: ':hover > svg' }),
    ).toBe('red');
    expect(declaredStyle({ element, property: 'stroke', pseudo: '>svg' })).toBe('');
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

describe('parseColor', () => {
  it.each([
    ['rgb(139, 49, 104)', { red: 139, green: 49, blue: 104, alpha: 1 }],
    ['rgba(139, 49, 104, 0.55)', { red: 139, green: 49, blue: 104, alpha: 0.55 }],
    ['rgb(139 49 104 / 55%)', { red: 139, green: 49, blue: 104, alpha: 0.55 }],
    ['  rgba(0, 0, 0, 0)  ', { red: 0, green: 0, blue: 0, alpha: 0 }],
    ['rgba(127.5, 127.5, 127.5, 1)', { red: 127.5, green: 127.5, blue: 127.5, alpha: 1 }],
    ['#8b3168', { red: 139, green: 49, blue: 104, alpha: 1 }],
    ['#FFF', { red: 255, green: 255, blue: 255, alpha: 1 }],
    ['rgb(255, 255, 255)', { red: 255, green: 255, blue: 255, alpha: 1 }],
    ['rgb(0 0 0 / 100%)', { red: 0, green: 0, blue: 0, alpha: 1 }],
    ['rgba(0, 0, 0, 1)', { red: 0, green: 0, blue: 0, alpha: 1 }],
  ])('reads the channels of %s', (value, expected) => {
    expect(parseColor(value)).toEqual(expected);
  });

  it.each([
    ['a named color', 'white'],
    ['a system color', 'Highlight'],
    ['an empty string', ''],
    ['a hexadecimal color of 4 digits', '#ffff'],
    ['a channel over 255', 'rgb(256, 0, 0)'],
    ['an alpha over 1', 'rgba(0, 0, 0, 1.5)'],
    ['an alpha over 100 %', 'rgb(0 0 0 / 101%)'],
    ['a negative channel', 'rgb(-1, 0, 0)'],
    ['two channels', 'rgb(0, 0)'],
    ['a number', 255],
    ['null', null],
    ['nothing', undefined],
  ])('reads nothing from %s', (_case, value) => {
    expect(parseColor(value)).toBeNull();
  });
});

describe('blendColors', () => {
  it('keeps an opaque color drawn over another one', () => {
    expect(blendColors({ foreground: '#8b3168', background: '#ffffff' })).toBe(
      'rgba(139, 49, 104, 1)',
    );
  });

  it('mixes a translucent color with the opaque color under it', () => {
    expect(blendColors({ foreground: 'rgba(0, 0, 0, 0.5)', background: '#ffffff' })).toBe(
      'rgba(127.5, 127.5, 127.5, 1)',
    );
  });

  it('gives a translucent result when both colors are translucent', () => {
    expect(
      blendColors({ foreground: 'rgba(255, 255, 255, 0.5)', background: 'rgba(0, 0, 0, 0.5)' }),
    ).toBe('rgba(170, 170, 170, 0.75)');
  });

  it('gives a transparent color when both colors are transparent', () => {
    expect(
      blendColors({ foreground: 'rgba(255, 255, 255, 0)', background: 'rgba(0, 0, 0, 0)' }),
    ).toBe('rgba(0, 0, 0, 0)');
  });

  it('rounds the channels rather than writing them with an exponent', () => {
    const blended = blendColors({ foreground: 'rgba(1, 1, 1, 0.0000001)', background: '#000' });

    expect(blended).toBe('rgba(0, 0, 0, 1)');
  });

  it.each([
    ['no colors', undefined],
    ['no foreground', { background: '#000' }],
    ['no background', { foreground: '#000' }],
    ['a foreground it cannot read', { foreground: 'Highlight', background: '#000' }],
    ['a background it cannot read', { foreground: '#000', background: 'black' }],
  ])('blends nothing with %s', (_case, params) => {
    expect(blendColors(params)).toBe('');
  });
});

describe('getContrastRatio', () => {
  it('gives 21 for white on black, whichever is the foreground', () => {
    expect(getContrastRatio({ foreground: '#ffffff', background: '#000000' })).toBeCloseTo(21);
    expect(getContrastRatio({ foreground: '#000000', background: '#ffffff' })).toBeCloseTo(21);
  });

  it('gives 1 for the same color', () => {
    expect(getContrastRatio({ foreground: '#8b3168', background: '#8b3168' })).toBe(1);
  });

  it('measures the plum and the light pink of the theme on black', () => {
    expect(getContrastRatio({ foreground: '#8b3168', background: '#000000' })).toBeCloseTo(2.74);
    expect(getContrastRatio({ foreground: '#d4a0c0', background: '#000000' })).toBeCloseTo(9.6, 1);
  });

  it('blends a translucent foreground over the background first', () => {
    // White at 35 %, the former inactive language button, which axe-core measured at 2.99:1
    const ratio = getContrastRatio({ foreground: 'rgba(255, 255, 255, 0.35)', background: '#000' });

    expect(ratio).toBeCloseTo(2.99, 1);
  });

  it.each([
    ['no colors', undefined],
    ['a translucent background', { foreground: '#fff', background: 'rgba(0, 0, 0, 0.5)' }],
    ['a background it cannot read', { foreground: '#fff', background: 'black' }],
    ['a foreground it cannot read', { foreground: 'white', background: '#000' }],
  ])('cannot measure with %s', (_case, params) => {
    expect(getContrastRatio(params)).toBeNaN();
  });
});
