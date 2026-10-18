import { isPeriodVariant } from './utils';

describe('isPeriodVariant', () => {
  it.each(['job', 'role', 'inline'])('accepts the look %j', variant => {
    expect(isPeriodVariant(variant)).toBe(true);
  });

  it.each([
    ['another look', 'column'],
    ['an uppercase look', 'Role'],
    ['a look with spaces', ' job '],
    ['a name of the prototype of an object', 'toString'],
    ['a key that reaches the prototype', '__proto__'],
    ['an empty string', ''],
    ['undefined', undefined],
    ['null', null],
    ['a number', 2],
    ['an array holding a look', ['job']],
    ['an object', { variant: 'job' }],
  ])('refuses %s', (_case, value) => {
    expect(isPeriodVariant(value)).toBe(false);
  });
});
