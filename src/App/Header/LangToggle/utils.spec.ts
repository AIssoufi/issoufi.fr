import { MAIN_MOUSE_BUTTON } from './constants.ts';
import { getRenderedPagePath, isPlainClick } from './utils.ts';

/** A click of the main button without any modifier key, which each test changes in one way. */
const PLAIN_CLICK = {
  button: MAIN_MOUSE_BUTTON,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
};

describe('isPlainClick', () => {
  it('accepts a click of the main button without any modifier key', () => {
    expect(isPlainClick(PLAIN_CLICK)).toBe(true);
  });

  it.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'])(
    'refuses a click with %s, which the browser handles itself',
    modifierKey => {
      expect(isPlainClick({ ...PLAIN_CLICK, [modifierKey]: true })).toBe(false);
    },
  );

  it.each([
    ['the middle button', 1],
    ['the secondary button', 2],
    ['a negative button', -1],
    ['a button that is not a number', Number.NaN],
  ])('refuses a click of %s', (_case, button) => {
    expect(isPlainClick({ ...PLAIN_CLICK, button })).toBe(false);
  });

  it('refuses a missing event', () => {
    expect(isPlainClick()).toBe(false);
    expect(isPlainClick(undefined)).toBe(false);
  });
});

describe('getRenderedPagePath', () => {
  it.each([
    ['/', '/'],
    ['/projects', '/projects'],
    ['/en/experiences', '/experiences'],
    ['/en/', '/'],
    ['/en', '/'],
    ['/en/projects/', '/projects'],
    ['/projects//', '/projects'],
  ])('gives %j the path of its page, %j', (pathname, path) => {
    expect(getRenderedPagePath(pathname)).toBe(path);
  });

  it.each(['/404', '/en/404', '/page-inconnue', '/projects/inconnu', '/PROJECTS', ''])(
    'gives %j, the path of no page, the path of the home',
    pathname => {
      expect(getRenderedPagePath(pathname)).toBe('/');
    },
  );
});
