import { STALE_CHUNK_RELOAD_COOLDOWN_MS } from './constants.ts';
import { focusPageHeading, isStaleChunkReloadAllowed, keepPendingWhileReloading } from './utils.ts';

const NOW = 1_800_000_000_000;

describe('isStaleChunkReloadAllowed', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty string', ''],
    ['blank text', '   '],
    ['text that is not a number', 'yesterday'],
    ['an infinite number', 'Infinity'],
  ])('allows a reload when the stored time is %s', (_, lastReloadAt) => {
    expect(isStaleChunkReloadAllowed({ lastReloadAt, now: NOW })).toBe(true);
  });

  it('allows a reload when the stored time is missing', () => {
    expect(isStaleChunkReloadAllowed({ now: NOW })).toBe(true);
  });

  it.each([
    ['just now', 0, false],
    ['a moment ago', 1, false],
    ['one millisecond within the cooldown', STALE_CHUNK_RELOAD_COOLDOWN_MS - 1, false],
    ['exactly one cooldown ago', STALE_CHUNK_RELOAD_COOLDOWN_MS, true],
    ['long ago', STALE_CHUNK_RELOAD_COOLDOWN_MS * 60, true],
  ])('reloads after a reload %s: %s', (_, elapsedMs, expected) => {
    const lastReloadAt = String(NOW - elapsedMs);

    expect(isStaleChunkReloadAllowed({ lastReloadAt, now: NOW })).toBe(expected);
  });

  it('allows a reload when the last one is in the future, after the clock was set back', () => {
    expect(isStaleChunkReloadAllowed({ lastReloadAt: String(NOW + 1), now: NOW })).toBe(true);
  });

  it('reads a stored time with spaces around it', () => {
    expect(isStaleChunkReloadAllowed({ lastReloadAt: ` ${NOW} `, now: NOW })).toBe(false);
  });

  it('uses the given cooldown', () => {
    const lastReloadAt = String(NOW - 1000);

    expect(isStaleChunkReloadAllowed({ lastReloadAt, now: NOW, cooldownMs: 1000 })).toBe(true);
    expect(isStaleChunkReloadAllowed({ lastReloadAt, now: NOW, cooldownMs: 1001 })).toBe(false);
  });

  it.each([NaN, Infinity, -Infinity])('refuses a reload when the current time is %s', now => {
    expect(isStaleChunkReloadAllowed({ lastReloadAt: null, now })).toBe(false);
  });
});

describe('keepPendingWhileReloading', () => {
  /** Value that wins the race against a promise that has not settled yet. */
  const PENDING = Symbol('pending');

  /** Settles with `PENDING` when `value` is still pending once the current tasks are done. */
  const settleOrPending = (value: unknown) =>
    Promise.race([value, new Promise(resolve => setTimeout(() => resolve(PENDING)))]);

  it('passes on a loaded module as it is', () => {
    const module = { default: () => null };

    expect(keepPendingWhileReloading(module)).toBe(module);
  });

  it('passes on a module without a default export', () => {
    const module = {};

    expect(keepPendingWhileReloading(module)).toBe(module);
  });

  it.each([
    ['undefined, as Vite resolves it during a reload', undefined],
    ['null', null],
  ])('keeps loading when the module is %s', async (_, module) => {
    const result = keepPendingWhileReloading(module);

    expect(result).toBeInstanceOf(Promise);
    await expect(settleOrPending(result)).resolves.toBe(PENDING);
  });

  it('keeps a dynamic import pending once chained to it', async () => {
    const load = Promise.resolve(undefined).then(keepPendingWhileReloading);

    await expect(settleOrPending(load)).resolves.toBe(PENDING);
  });

  it('lets a failed import reject', async () => {
    const error = new TypeError('Failed to fetch dynamically imported module');
    const load = Promise.reject(error).then(keepPendingWhileReloading);

    await expect(load).rejects.toBe(error);
  });
});

/** Fills the document with some HTML and returns its body. */
const renderHtml = (html: string) => {
  document.body.innerHTML = html;
  return document.body;
};

describe('focusPageHeading', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses the first h1 of the document, out of the Tab order', () => {
    renderHtml('<a href="/">Link</a><h1>Projects</h1><h1>Freelance</h1>');

    focusPageHeading();

    const [heading] = document.querySelectorAll('h1');
    expect(heading).toHaveFocus();
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('keeps the tabindex a heading already has', () => {
    renderHtml('<h1 tabindex="0">Projects</h1>');

    focusPageHeading();

    expect(document.querySelector('h1')).toHaveFocus();
    expect(document.querySelector('h1')).toHaveAttribute('tabindex', '0');
  });

  it('looks for the heading inside the given root only', () => {
    renderHtml('<h1>Outside</h1><section><h1>Inside</h1></section>');

    focusPageHeading({ root: document.querySelector('section') });

    expect(document.querySelector('section h1')).toHaveFocus();
  });

  it('ignores the headings of a lower level', () => {
    renderHtml('<button>Button</button><h2>Section</h2>');
    document.querySelector('button')?.focus();

    focusPageHeading();

    expect(document.querySelector('button')).toHaveFocus();
    expect(document.querySelector('h2')).not.toHaveAttribute('tabindex');
  });

  it.each([
    ['a root without heading', () => renderHtml('<p>Text</p>')],
    ['an empty root', () => renderHtml('')],
    ['a missing root', () => null],
  ])('leaves the focus where it is for %s', (_case, getRoot) => {
    const root = getRoot();
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();

    expect(() => focusPageHeading({ root })).not.toThrow();

    expect(button).toHaveFocus();
  });

  it('leaves the focus where it is without any parameter on a page without heading', () => {
    renderHtml('<button>Button</button>');
    document.querySelector('button')?.focus();

    focusPageHeading();

    expect(document.querySelector('button')).toHaveFocus();
  });
});
