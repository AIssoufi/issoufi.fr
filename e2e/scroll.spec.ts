import { getPageScrollY, scrollToEnd } from './scroll.ts';

/** Fakes a page scrolled by `scrollY` pixels, with a document `scrollHeight` pixels high. */
const fakePage = ({ scrollY = 0, scrollHeight = 0 } = {}) => {
  let currentScrollY = scrollY;
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => currentScrollY);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(scrollHeight);
  // jsdom does not scroll: the fake scrolls as far as the browser would, to the end of the page
  const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(options => {
    const top = (options as ScrollToOptions).top ?? 0;
    currentScrollY = Math.max(0, top - window.innerHeight);
  });
  return { scrollTo };
};

describe('getPageScrollY', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([0, 300, 2764.5])('reads a scroll position of %d px', scrollY => {
    fakePage({ scrollY });

    expect(getPageScrollY()).toBe(scrollY);
  });
});

describe('scrollToEnd', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls at once to the end of the page, and returns the position reached', () => {
    const { scrollTo } = fakePage({ scrollHeight: window.innerHeight + 2764 });

    expect(scrollToEnd()).toBe(2764);
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({
      top: window.innerHeight + 2764,
      behavior: 'instant',
    });
  });

  describe('edge cases', () => {
    it.each([
      ['a page no higher than the screen', () => window.innerHeight],
      ['an empty page', () => 0],
    ])('stays at the top of %s', (_case, getScrollHeight) => {
      fakePage({ scrollHeight: getScrollHeight() });

      expect(scrollToEnd()).toBe(0);
    });
  });
});
