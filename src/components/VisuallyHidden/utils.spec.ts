import { isVisuallyHiddenElement } from './utils.ts';

describe('isVisuallyHiddenElement', () => {
  it.each(['span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])('accepts the element %j', element => {
    expect(isVisuallyHiddenElement(element)).toBe(true);
  });

  it.each([
    ['another element', 'div'],
    ['a dangerous element', 'script'],
    ['an uppercase element', 'H2'],
    ['an element with spaces', ' h2 '],
    ['a heading level past h6', 'h7'],
    ['an empty string', ''],
    ['undefined', undefined],
    ['null', null],
    ['a number', 2],
    ['an array holding an element', ['h2']],
    ['an object', { as: 'h2' }],
    ['a name of the prototype of an array', 'toString'],
  ])('refuses %s', (_case, value) => {
    expect(isVisuallyHiddenElement(value)).toBe(false);
  });
});
