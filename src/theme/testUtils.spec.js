import {
  findRawThemeValues,
  findRawValues,
  findUnguardedHovers,
  getSmallestFontSizePx,
} from './testUtils';

/** Values found in a source, as `kind value` strings, to compare them at a glance. */
const valuesIn = source => findRawValues(source).map(({ kind, value }) => `${kind} ${value}`);

describe('findRawValues', () => {
  it('finds the lengths, durations, colors and easings written by hand, with their lines', () => {
    const source = [
      'export const Card = styled.div`',
      '  height: 72px;',
      '  transition: color 0.2s ease;',
      '  background: #8b3168;',
      '`;',
    ].join('\n');

    expect(findRawValues(source)).toEqual([
      { line: 2, kind: 'length', value: '72px' },
      { line: 3, kind: 'duration', value: '0.2s' },
      { line: 3, kind: 'easing', value: 'ease' },
      { line: 4, kind: 'color', value: '#8b3168' },
    ]);
  });

  it.each([
    ['a length in pixels', 'top: 20px;', ['length 20px']],
    ['a negative length', 'transform: translateY(-12px);', ['length -12px']],
    ['a decimal length without its leading zero', 'margin: .5em;', ['length .5em']],
    [
      'a length relative to the font',
      'gap: 1.5rem; max-width: 40ch;',
      ['length 1.5rem', 'length 40ch'],
    ],
    ['a unit in capitals', 'width: 10PX;', ['length 10PX']],
    ['a length inside calc()', 'flex: 0 0 calc(33.333% - 10px);', ['length 10px']],
    [
      'a length in a JavaScript string',
      "min-width: ${p => (p.$a ? 'unset' : '260px')};",
      ['length 260px'],
    ],
    ['a breakpoint', '@media (min-width: 50em) {', ['length 50em']],
    ['a duration in milliseconds', 'animation-delay: 150ms;', ['duration 150ms']],
    ['a short hexadecimal color', 'color: #fff;', ['color #fff']],
    ['a translucent color', 'color: rgba(0, 0, 0, 0.5);', ['color rgba(']],
    [
      'a color function',
      'color: hsl(0 0% 0%); fill: oklch(0.5 0.1 200);',
      ['color hsl(', 'color oklch('],
    ],
    ['a color name', 'color: white; border-color: Red;', ['color white', 'color Red']],
    [
      'an easing function',
      'transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);',
      ['duration 0.2s', 'easing cubic-bezier('],
    ],
    ['an easing keyword', 'animation-timing-function: ease-in-out;', ['easing ease-in-out']],
    ['a linear easing', 'animation: spin 5s linear infinite;', ['duration 5s', 'easing linear']],
    ['a raw z-index', 'z-index: 2;', ['scale z-index: 2']],
    ['a raw font weight', 'font-weight: 600;', ['scale font-weight: 600']],
    ['a raw line height', 'line-height: 1.5;', ['scale line-height: 1.5']],
    ['a raw z-index of zero', 'z-index: 0;', ['scale z-index: 0']],
  ])('finds %s', (_description, source, expected) => {
    expect(valuesIn(source)).toEqual(expected);
  });

  it.each([
    [
      'the th helpers and their arguments',
      "padding: ${th.space(16)} ${th.space(-8)}; transition: color ${th.duration(200)} ${th.timingFunction('linear')};",
    ],
    [
      'the generic th helper',
      "@media (min-width: ${th('screens.tablet')}) { backdrop-filter: ${th('blurs.8')}; }",
    ],
    ['the theme object read by keyframes', 'transform: translateY(-${theme.space[12]});'],
    [
      'a named constant interpolated with a unit',
      'width: ${BUTTON_WIDTH_PX}px; height: ${RADIUS_PX * 2}px;',
    ],
    [
      'zero with or without a unit',
      'margin: 0; transform: translateY(0px) rotate(0deg); transition-delay: 0s; top: -0px;',
    ],
    ['percentages', 'top: 50%; transform: translateY(-50%); width: 33.333%;'],
    ['viewport units', 'height: 100vh; min-height: 60vh; max-width: 100vw; height: 100dvh;'],
    [
      'angles and fractions',
      'background: linear-gradient(180deg, transparent 0%); grid-template-columns: 1fr 2fr;',
    ],
    ['unitless numbers', 'transform: scale(1.06); opacity: 0.5; flex: 1; order: 3;'],
    [
      'gradients, which only share their name with the linear easing',
      'background: repeating-linear-gradient(transparent, currentColor);',
    ],
    ['words that start with a color name', 'white-space: nowrap; color: inherit;'],
    [
      'numbers inside identifiers and selectors',
      "h1[tabindex='-1']:focus { transform: translate3d(${x}, 0, 0); }",
    ],
    [
      'a token for the scaled properties',
      "z-index: ${th.zIndex('raised')}; font-weight: ${th.fontWeight('bold')};",
    ],
    ['a block comment', '/* 240px for the label, plus the 32px side paddings */'],
    ['a block comment over several lines', '/* the dot is\n   16px wide, with a #fff border */'],
    ['a line comment', '// Space around each card: 10px, 0.2s ease'],
    ['a comment after a value', 'right: ${th.space(-8)}; /* right edge at 90px + 8px */'],
  ])('ignores %s', (_description, source) => {
    expect(findRawValues(source)).toEqual([]);
  });

  it('counts the lines of a multi-line comment, to report the values after it on their line', () => {
    const source = '/* first\n   second */\nheight: 72px;';

    expect(findRawValues(source)).toEqual([{ line: 3, kind: 'length', value: '72px' }]);
  });

  it('keeps a URL, whose slashes do not start a comment', () => {
    expect(valuesIn("background: url('https://example.com/a.png') 10px;")).toEqual(['length 10px']);
  });

  it('lists the values of a line in the order of the source', () => {
    expect(valuesIn('border: 1px solid #000; box-shadow: 0 4px 24px black;')).toEqual([
      'length 1px',
      'color #000',
      'length 4px',
      'length 24px',
      'color black',
    ]);
  });

  it.each([
    ['an empty source', ''],
    ['a source of blank lines', '\n\n  \n'],
    ['undefined', undefined],
    ['null', null],
    ['a number', 72],
    ['an object', { height: '72px' }],
  ])('finds nothing in %s', (_description, source) => {
    expect(findRawValues(source)).toEqual([]);
  });
});

/** Values found in a theme source, as `kind value` strings. */
const themeValuesIn = source =>
  findRawThemeValues(source).map(({ kind, value }) => `${kind} ${value}`);

describe('findRawThemeValues', () => {
  it('finds the values written by hand in a theme, with their lines', () => {
    const source = [
      "import { radii, sizes } from './tokens';",
      '',
      'export const theme = {',
      "  radii: { sm: '8px', md: radii[12] },",
      '  borders: {',
      '    card: `${sizes[1]} solid',
      '      #fff`,',
      '  },',
      '} as const;',
    ].join('\n');

    expect(findRawThemeValues(source)).toEqual([
      { line: 4, kind: 'literal', value: "'8px'" },
      { line: 7, kind: 'color', value: '#fff' },
    ]);
  });

  it.each([
    ['a string', "radii: { sm: '8px' }", ["literal '8px'"]],
    ['a number', 'fontWeights: { bold: 700 }', ['literal 700']],
    [
      'a number with its sign',
      'zIndices: { behind: -1, raised: +1 }',
      ['literal -1', 'literal +1'],
    ],
    [
      'a template literal without interpolation',
      'easings: { standard: `ease` }',
      ['literal `ease`'],
    ],
    [
      'a raw value before an interpolation',
      'borders: { card: `1px solid ${colors.accent}` }',
      ['length 1px'],
    ],
    [
      'raw values after an interpolation',
      "shadows: { card: `${shadowShapes['4-24']} rgba(0, 0, 0, 0.3)` }",
      ['color rgba('],
    ],
    [
      'raw values between two interpolations',
      'shadows: { card: `${a} 0 4px ${b} #000` }',
      ['length 4px', 'color #000'],
    ],
    ['a literal inside an interpolation', "card: `${'1px'} solid`", ["literal '1px'"]],
    ['a constant', "const RADIUS = '8px';", ["literal '8px'"]],
    ['an array of values', 'opacities: [10, 20]', ['literal 10', 'literal 20']],
    ['a spread object', "{ ...{ sm: '8px' } }", ["literal '8px'"]],
    [
      'the arguments of a function that is not a primitive builder',
      'radius: Math.max(8, 12)',
      ['literal 8', 'literal 12'],
    ],
    [
      'the arguments of a builder imported from another module',
      "import { alphaVariants } from './colors'; alphaVariants({ name: 'accent' });",
      ["literal 'accent'"],
    ],
    [
      'the arguments of a method of a primitive',
      "import { palette } from './tokens'; theme = { a: palette.white.replace('#fff', '#000') };",
      ["literal '#fff'", "literal '#000'"],
    ],
    [
      'the arguments of a method of a primitive read from a namespace import',
      "import * as tokens from './tokens'; theme = { a: tokens.radii[12].concat('4px') };",
      ["literal '4px'"],
    ],
    [
      'the arguments of a builder read with brackets',
      "import * as tokens from './tokens'; tokens['alphaVariants']({ name: 'accent' });",
      ["literal 'accent'"],
    ],
    [
      'the values after an import of tokens.ts for its side effects',
      "import './tokens'; const theme = { raised: 1 };",
      ['literal 1'],
    ],
    ['the values read before a syntax error', "const theme = { sm: '8px', md: ", ["literal '8px'"]],
  ])('finds %s', (_description, source, expected) => {
    expect(themeValuesIn(source)).toEqual(expected);
  });

  it.each([
    ['references to primitives', 'theme = { space: { page: spacing[24] }, accent: palette.plum };'],
    [
      'the keys of element accesses',
      "theme = { a: colors['accent-a55'], b: zIndices[-2], c: tokens.radii[12] };",
    ],
    ['the keys of objects', "theme = { 0: radii[0], 'icon-gap': relativeSpacing[70] };"],
    ['computed keys', "theme = { ['icon-gap']: relativeSpacing[70] };"],
    ['shorthand properties and spreads', 'theme = { fontSizes, space: { ...spacing } };'],
    ['negated references', 'theme = { offset: -spacing[8] };'],
    [
      'the modules of imports and exports',
      "import { palette } from './tokens'; export { theme } from './theme'; export * from './x';",
    ],
    ['types', "const accent: 'plum' | 1 = palette.plum; theme = { accent } as const;"],
    ['comments', "theme = {\n  // '8px' by hand\n  /* #fff, 0.2s ease */\n  sm: radii[8],\n};"],
    [
      'the arguments of a builder imported from tokens.ts',
      "import { alphaVariants, rgb } from './tokens';\n" +
        "colors = { ...alphaVariants({ name: 'accent', rgb: rgb.plum, opacities: [10, 20] as const }) };",
    ],
    [
      'the arguments of a renamed builder',
      "import { alphaVariants as variants } from './tokens'; variants({ name: 'accent' });",
    ],
    [
      'the arguments of a builder read from a namespace import',
      "import * as tokens from './tokens'; tokens.alphaVariants({ name: 'accent' });",
    ],
    [
      'the arguments of a default import of tokens.ts',
      "import build from './tokens'; build({ name: 'accent' });",
    ],
    [
      'a template that only reads tokens and keywords',
      "card: `${sizes[1]} solid ${colors['foreground-a10']}`, shadow: `${a}, ${b}`",
    ],
  ])('allows %s', (_description, source) => {
    expect(findRawThemeValues(source)).toEqual([]);
  });

  it.each([
    ['an empty source', ''],
    ['undefined', undefined],
    ['null', null],
    ['a number', 72],
    ['an object', { radii: { sm: '8px' } }],
  ])('finds nothing in %s', (_description, source) => {
    expect(findRawThemeValues(source)).toEqual([]);
  });
});

describe('getSmallestFontSizePx', () => {
  it.each([
    ['12px', 12],
    ['13.5px', 13.5],
    [' 16px ', 16],
    ['clamp(16px, 12px + 0.75vmin, 24px)', 16],
    ['clamp( 24px , 12px + 4vmin, 72px)', 24],
  ])('reads %j as %d px', (size, expected) => {
    expect(getSmallestFontSizePx(size)).toBe(expected);
  });

  it.each([
    ['a size in rem', '1rem'],
    ['a size in em', '0.75em'],
    ['a clamp whose smallest value is in rem', 'clamp(1rem, 2vw, 24px)'],
    ['a min() of two sizes', 'min(12px, 2vw)'],
    ['a size with a unit after the pixels', '12pxx'],
    ['a negative size', '-12px'],
    ['an empty string', ''],
    ['a number', 12],
    ['null', null],
    ['nothing', undefined],
  ])('cannot read %s', (_case, size) => {
    expect(getSmallestFontSizePx(size)).toBeNaN();
  });
});

describe('findUnguardedHovers', () => {
  it('finds a :hover outside any media query, with its line', () => {
    const source = [
      'export const Card = styled.div`',
      "  color: ${th.color('foreground')};",
      '',
      '  &:hover {',
      "    color: ${th.color('accent')};",
      '  }',
      '`;',
    ].join('\n');

    expect(findUnguardedHovers(source)).toEqual([4]);
  });

  it.each([
    ['in another media query', "@media (min-width: ${th('screens.tablet')}) {\n  &:hover {}\n}"],
    ['in a negation', '&:not(:hover) {\n}'],
    ['after the class of another component', '${ProjectItem}:hover & {\n}'],
    ['in a global selector list', 'a,\nbutton:hover {\n}'],
    ['in the query of reduced motion', '@media ${REDUCED_MOTION_QUERY} {\n  &:hover {}\n}'],
    ['in a selector that names the query', '[data-query="${HOVER_POINTER_QUERY}"]:hover {\n}'],
  ])('finds a :hover %s', (_case, source) => {
    expect(findUnguardedHovers(source)).toHaveLength(1);
  });

  it.each([
    ['alone', '@media ${HOVER_POINTER_QUERY} {\n  &:hover {}\n}'],
    [
      'after other conditions',
      "@media (min-width: ${th('screens.tablet')}) and ${HOVER_POINTER_QUERY} {\n  a:hover {}\n}",
    ],
    ['deep inside', '@media ${HOVER_POINTER_QUERY} {\n  &:hover {\n    > svg:hover {}\n  }\n}'],
    [
      'in a css block that it interpolates',
      '@media ${HOVER_POINTER_QUERY} {\n  ${props => props.$a && css`&:hover {}`}\n}',
    ],
    [
      'in a css block interpolated in the styles',
      '${props => !props.$a && css`\n  @media ${HOVER_POINTER_QUERY} {\n    &:hover {}\n  }\n`}',
    ],
  ])('allows a :hover in a block of the media query %s', (_case, source) => {
    expect(findUnguardedHovers(source)).toEqual([]);
  });

  it('finds a :hover written once the block of the media query is closed', () => {
    const source = [
      '@media ${HOVER_POINTER_QUERY} {',
      "  color: ${props => (props.$a ? th.color('accent') : th.color('foreground'))};",
      '  &:hover {}',
      '}',
      '&:focus-visible:hover {}',
    ].join('\n');

    expect(findUnguardedHovers(source)).toEqual([5]);
  });

  it('finds a :hover of a css block interpolated outside the media query', () => {
    const source = '${props => props.$a && css`\n  &:hover {\n  }\n`}';

    expect(findUnguardedHovers(source)).toEqual([2]);
  });

  it('ignores a :hover named in a comment', () => {
    const source = [
      '/* The global style grows buttons on :hover */',
      '// a:hover is the accent from tablet up',
      "color: ${th.color('accent')};",
    ].join('\n');

    expect(findUnguardedHovers(source)).toEqual([]);
  });

  describe('edge cases', () => {
    it.each([
      ['an empty source', ''],
      ['a source without any :hover', 'export const A = styled.div`\n  color: red;\n`;'],
      ['a closing brace with no block', '}\n@media ${HOVER_POINTER_QUERY} {\n  &:hover {}\n}'],
      ['a number', 42],
      ['null', null],
      ['nothing', undefined],
    ])('finds nothing in %s', (_case, source) => {
      expect(findUnguardedHovers(source)).toEqual([]);
    });
  });
});
