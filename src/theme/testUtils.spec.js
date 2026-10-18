import { findRawValues } from './testUtils';

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
