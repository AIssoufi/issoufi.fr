import { stubMatchMedia } from './mediaQueryTestUtils.ts';

const QUERY = '(prefers-reduced-motion: reduce)';

describe('stubMatchMedia', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('replaces window.matchMedia with a stub whose queries do not match by default', () => {
    const { matchMedia } = stubMatchMedia();

    expect(window.matchMedia).toBe(matchMedia);
    expect(window.matchMedia(QUERY).matches).toBe(false);
    expect(matchMedia).toHaveBeenCalledWith(QUERY);
  });

  it.each([true, false])('makes every query match as asked: %s', matches => {
    stubMatchMedia({ matches });

    expect(window.matchMedia(QUERY).matches).toBe(matches);
    expect(window.matchMedia('(min-width: 50em)').matches).toBe(matches);
  });

  it('is undone by vi.unstubAllGlobals', () => {
    const original = window.matchMedia;
    stubMatchMedia({ matches: true });

    vi.unstubAllGlobals();

    expect(window.matchMedia).toBe(original);
  });

  it('changes the result and notifies every listener with setMatches', () => {
    const { mediaQueryList, setMatches } = stubMatchMedia();
    const first = vi.fn();
    const second = vi.fn();
    mediaQueryList.addEventListener('change', first);
    mediaQueryList.addEventListener('change', second);

    setMatches(true);

    expect(mediaQueryList.matches).toBe(true);
    expect(window.matchMedia(QUERY).matches).toBe(true);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('no longer notifies a removed listener', () => {
    const { mediaQueryList, setMatches } = stubMatchMedia();
    const listener = vi.fn();
    mediaQueryList.addEventListener('change', listener);
    mediaQueryList.removeEventListener('change', listener);

    setMatches(true);

    expect(listener).not.toHaveBeenCalled();
  });

  it('changes the result without failing when nothing listens', () => {
    const { mediaQueryList, setMatches } = stubMatchMedia({ matches: true });

    expect(() => setMatches(false)).not.toThrow();
    expect(mediaQueryList.matches).toBe(false);
  });
});
