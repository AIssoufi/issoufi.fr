// @vitest-environment node
import { minifyCssQuasis } from './cssQuasis.ts';

/** No-break space, a character of a name in CSS rather than whitespace. */
const NO_BREAK_SPACE = String.fromCharCode(0xa0);

describe('minifyCssQuasis', () => {
  it('replaces each run of whitespace with one space', () => {
    expect(minifyCssQuasis(['\n\n  margin:\t0   auto\r\n\f'])).toEqual([' margin: 0 auto ']);
  });

  it('removes the comments that whitespace separates from the code, with that whitespace', () => {
    expect(
      minifyCssQuasis(['\n  /* Note */\n  color: red; /* a */ /* b */\n  a/* c */ b /* d */c']),
    ).toEqual([' color: red; a b c']);
  });

  it('keeps a run of comments without whitespace, which separates two tokens', () => {
    expect(minifyCssQuasis(['margin: 0/* a *//* b */auto;'])).toEqual([
      'margin: 0/* a *//* b */auto;',
    ]);
  });

  it('ends a comment at the first end after its start only', () => {
    expect(minifyCssQuasis(['a /*/ b */ c'])).toEqual(['a c']);
  });

  it('keeps the text of the strings, and a quote of the other kind in them', () => {
    expect(
      minifyCssQuasis([`content:  '  /* a */  ';\n  font-family: "A  B";\n  quotes: "it's" '"';`]),
    ).toEqual([`content: '  /* a */  '; font-family: "A  B"; quotes: "it's" '"';`]);
  });

  it('keeps a no-break space, which is no whitespace in CSS', () => {
    expect(minifyCssQuasis([`a${NO_BREAK_SPACE}\n  b`])).toEqual([`a${NO_BREAK_SPACE} b`]);
  });

  it('minifies each text on its own, keeping a space on each side of an interpolation', () => {
    expect(minifyCssQuasis(['\n  margin: ', '  ', ';\n  ', '\n'])).toEqual([
      ' margin: ',
      ' ',
      '; ',
      ' ',
    ]);
  });

  it('keeps a string that goes on after an interpolation', () => {
    expect(minifyCssQuasis(["content: '  ", "  ';\n  color: red;"])).toEqual([
      "content: '  ",
      "  '; color: red;",
    ]);
  });

  it('keeps a comment that goes on after an interpolation', () => {
    expect(minifyCssQuasis(['color: red;\n  /* a ', ' b */\n  margin: 0;'])).toEqual([
      'color: red; /* a ',
      ' b */ margin: 0;',
    ]);
  });

  it.each([
    ['an escape', ["content: '\\2014';\n  color: red;"]],
    ['an escape in another text', ['\n  margin: ', ";\n  content: '\\2014';"]],
    ['a line comment', ['color: red; // Note\n  margin: 0;']],
    ['a line comment in a URL', ['\n  background: url(http://a.b/c.png);\n']],
    ['a string that it does not close', ["content: 'a;\n  color: red;"]],
    ['a string that it does not close after an interpolation', ["content: '", ';\n  color: red;']],
    ['a comment that it does not close', ['color: red;\n  /* Note\n']],
    ['a comment that it does not close after an interpolation', ['color: red;\n  /* ', '\n']],
  ])('leaves a template with %s as it is', (_, quasis) => {
    expect(minifyCssQuasis(quasis)).toEqual(quasis);
  });

  it.each([
    ['no text', [], []],
    ['an empty text', [''], ['']],
    ['empty texts around an interpolation', ['', ''], ['', '']],
    ['whitespace only', ['  \n  '], [' ']],
    ['a comment only', ['/* Note */'], ['/* Note */']],
  ])('handles %s', (_, quasis, expected) => {
    expect(minifyCssQuasis(quasis)).toEqual(expected);
  });

  it('leaves the texts it receives as they were', () => {
    const quasis = ['\n  color: red;\n'];

    minifyCssQuasis(quasis);

    expect(quasis).toEqual(['\n  color: red;\n']);
  });
});
