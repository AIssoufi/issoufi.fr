import { errors, type Page } from '@playwright/test';

import { BLANK_PAGE_URL, NAVIGATION_COMMIT_TIMEOUT_MS } from './constants.ts';
import { gotoRoute } from './navigation.ts';

const ROUTE = '/projects';
const ROUTE_URL = `http://localhost:4173${ROUTE}`;
const OTHER_ROUTE_URL = 'http://localhost:4173/experiences';

/** Time a test may take in WebKit, which ends a `page.goto` that sets no timeout of its own. */
const TEST_TIMEOUT_MS = 60_000;
/** Delay of a navigation that never commits, which WebKit dropped. */
const LOST = Infinity;

/** Answers of the fake tab, one for each navigation. */
interface FakePageOptions {
  /** Time each navigation takes to commit, in milliseconds, or {@link LOST}. */
  commitDelaysMs?: number[];
  /** URL of the tab before the first navigation commits. */
  url?: string;
  /** Answer of each navigation that commits. */
  response?: unknown;
}

/** Fakes a tab whose `goto` times out as Playwright does, at the timeout that the helper sets. */
const fakePage = ({
  commitDelaysMs = [0],
  url = BLANK_PAGE_URL,
  response = { ok: true },
}: FakePageOptions = {}) => {
  let currentUrl = url;
  const delaysMs = [...commitDelaysMs];
  const goto = vi.fn(
    async (_route: string, { timeout = TEST_TIMEOUT_MS }: { timeout?: number } = {}) => {
      const delayMs = delaysMs.shift() ?? LOST;
      if (delayMs > timeout) throw new errors.TimeoutError(`Timeout ${timeout}ms exceeded`);
      currentUrl = ROUTE_URL;
      return response;
    },
  );
  const waitForLoadState = vi.fn(async () => {});
  const page = { goto, url: () => currentUrl, waitForLoadState } as unknown as Page;
  return { page, goto, waitForLoadState };
};

describe('gotoRoute', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the route once, up to the load event, and returns its answer', async () => {
    const response = { ok: true };
    const { page, goto, waitForLoadState } = fakePage({ response });

    await expect(gotoRoute({ page, route: ROUTE })).resolves.toBe(response);

    expect(goto).toHaveBeenCalledExactlyOnceWith(ROUTE, {
      waitUntil: 'commit',
      timeout: NAVIGATION_COMMIT_TIMEOUT_MS,
    });
    expect(waitForLoadState).toHaveBeenCalledExactlyOnceWith('load');
    expect(goto).toHaveBeenCalledBefore(waitForLoadState);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([NAVIGATION_COMMIT_TIMEOUT_MS - 1, NAVIGATION_COMMIT_TIMEOUT_MS])(
    'never starts again a slow navigation that commits in %i ms',
    async commitDelayMs => {
      const { page, goto } = fakePage({ commitDelaysMs: [commitDelayMs] });

      await gotoRoute({ page, route: ROUTE });

      expect(goto).toHaveBeenCalledOnce();
      expect(console.warn).not.toHaveBeenCalled();
    },
  );

  it('opens the route again when the tab is still blank after the timeout', async () => {
    const response = { ok: true };
    const { page, goto, waitForLoadState } = fakePage({ commitDelaysMs: [LOST, 0], response });

    await expect(gotoRoute({ page, route: ROUTE })).resolves.toBe(response);

    expect(goto).toHaveBeenCalledTimes(2);
    // A second navigation that gives up early would fail a test that still has time
    expect(goto).toHaveBeenLastCalledWith(ROUTE, { waitUntil: 'commit' });
    expect(goto.mock.invocationCallOrder[1]).toBeLessThan(
      waitForLoadState.mock.invocationCallOrder[0],
    );
    expect(console.warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining(ROUTE));
  });

  describe('edge cases', () => {
    it('opens the route again just past the timeout, where a tab cannot tell it from lost', async () => {
      const { page, goto } = fakePage({ commitDelaysMs: [NAVIGATION_COMMIT_TIMEOUT_MS + 1, 0] });

      await gotoRoute({ page, route: ROUTE });

      expect(goto).toHaveBeenCalledTimes(2);
    });

    it('gives up after one more navigation, with the error of the second one', async () => {
      const { page, goto, waitForLoadState } = fakePage({ commitDelaysMs: [LOST, LOST] });

      await expect(gotoRoute({ page, route: ROUTE })).rejects.toThrow(errors.TimeoutError);

      expect(goto).toHaveBeenCalledTimes(2);
      expect(waitForLoadState).not.toHaveBeenCalled();
    });

    it('never starts again a navigation that times out away from a blank tab', async () => {
      const { page, goto } = fakePage({ commitDelaysMs: [LOST], url: OTHER_ROUTE_URL });

      await expect(gotoRoute({ page, route: ROUTE })).rejects.toThrow(errors.TimeoutError);

      expect(goto).toHaveBeenCalledOnce();
    });

    it('never starts again a navigation that failed with another error', async () => {
      const error = new Error('net::ERR_CONNECTION_REFUSED');
      const { page, goto } = fakePage();
      goto.mockRejectedValueOnce(error);

      await expect(gotoRoute({ page, route: ROUTE })).rejects.toBe(error);

      expect(goto).toHaveBeenCalledOnce();
    });

    it('returns no answer for a navigation that has none, as page.goto does', async () => {
      const { page, waitForLoadState } = fakePage({ response: null });

      await expect(gotoRoute({ page, route: ROUTE })).resolves.toBeNull();

      expect(waitForLoadState).toHaveBeenCalledOnce();
    });
  });
});
