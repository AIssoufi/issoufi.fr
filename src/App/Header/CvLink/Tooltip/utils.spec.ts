import { isTooltipPlacement } from './utils';

describe('isTooltipPlacement', () => {
  it.each(['left', 'top'])('accepts the placement %j', placement => {
    expect(isTooltipPlacement(placement)).toBe(true);
  });

  it.each([
    ['another side', 'right'],
    ['an uppercase placement', 'LEFT'],
    ['a placement with spaces', ' top '],
    ['an empty string', ''],
    ['undefined', undefined],
    ['null', null],
    ['a number', 0],
    ['an array holding a placement', ['top']],
    ['an object', { placement: 'top' }],
  ])('refuses %s', (_case, value) => {
    expect(isTooltipPlacement(value)).toBe(false);
  });
});
