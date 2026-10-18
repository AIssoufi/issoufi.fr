import { isLanguage } from './utils';

describe('isLanguage', () => {
  it.each(['fr', 'en'])('accepts the language of the site %j', value => {
    expect(isLanguage(value)).toBe(true);
  });

  it.each(['de', 'EN', 'Fr', 'en-US', ' en', 'en ', '', '"en"', 'null', 'undefined'])(
    'rejects the string %j',
    value => {
      expect(isLanguage(value)).toBe(false);
    },
  );

  it.each([null, undefined, 0, 42, NaN, true, {}, ['en'], { en: 'en' }])(
    'rejects the value %j, which is not a string',
    value => {
      expect(isLanguage(value)).toBe(false);
    },
  );
});
