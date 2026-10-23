import { UNCOLORED_ENV, withoutColors } from './testUtils.js';

describe('withoutColors', () => {
  it('drops FORCE_COLOR, sets NO_COLOR and keeps the other variables', () => {
    expect(withoutColors({ FORCE_COLOR: '1', PATH: '/bin', CI: 'true' })).toEqual({
      PATH: '/bin',
      CI: 'true',
      NO_COLOR: '1',
    });
  });

  it.each([
    ['FORCE_COLOR set to 0', { FORCE_COLOR: '0' }],
    ['an empty FORCE_COLOR', { FORCE_COLOR: '' }],
    ['NO_COLOR set to 0', { NO_COLOR: '0' }],
    ['an empty NO_COLOR', { NO_COLOR: '' }],
    ['an empty environment', {}],
  ])('turns the colors off with %s', (_, env) => {
    expect(withoutColors(env)).toEqual({ NO_COLOR: '1' });
  });

  it('leaves the given environment as it is', () => {
    const env = { FORCE_COLOR: '3', PATH: '/bin' };

    withoutColors(env);

    expect(env).toEqual({ FORCE_COLOR: '3', PATH: '/bin' });
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['a text', 'FORCE_COLOR=1'],
    ['a number', 1],
    ['a boolean', true],
    ['an array', ['FORCE_COLOR=1']],
  ])('counts %s as an empty environment', (_, env) => {
    expect(withoutColors(env)).toEqual({ NO_COLOR: '1' });
  });
});

describe('UNCOLORED_ENV', () => {
  it('is the environment of the tests without colors', () => {
    expect(UNCOLORED_ENV).not.toHaveProperty('FORCE_COLOR');
    expect(UNCOLORED_ENV).toHaveProperty('NO_COLOR', '1');
    expect(UNCOLORED_ENV).toHaveProperty('PATH', process.env.PATH);
  });
});
