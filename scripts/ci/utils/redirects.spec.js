import { MAX_REDIRECT_HOPS, REDIRECT_STATUSES } from '../constants.mjs';
import {
  checkRedirect,
  compareRedirect,
  compareRedirectChain,
  resolveRedirectUrl,
} from './redirects.mjs';

const URL_HTTP = 'http://issoufi.fr/';
const URL_WWW = 'https://www.issoufi.fr/';
const URL_HTTP_WWW = 'http://www.issoufi.fr/';
const EXPECTED_URL = 'https://issoufi.fr/';
const INVALID_ADDRESSES_PROBLEM =
  'A redirect check without a valid address and expected address cannot be compared';
const TWO_HOPS_PROBLEM =
  `${URL_HTTP_WWW}: reaches ${EXPECTED_URL} in 2 redirects instead of 1, ` + `through "${URL_WWW}"`;
const WRONG_FIRST_HOP_PROBLEM =
  `${URL_HTTP_WWW}: redirects to "${URL_WWW}" ` + `instead of ${EXPECTED_URL}`;

/** Answer of `http://www.issoufi.fr/`, which redirects to `https://www.issoufi.fr/`. */
const HTTP_WWW_ANSWER = { url: URL_HTTP_WWW, status: 301, location: URL_WWW };

/** Answer of `https://www.issoufi.fr/`, which redirects to the expected address. */
const WWW_ANSWER = { url: URL_WWW, status: 301, location: EXPECTED_URL };

describe('resolveRedirectUrl', () => {
  it.each(REDIRECT_STATUSES)('reads the location of a %s redirect', status => {
    expect(resolveRedirectUrl({ url: URL_HTTP, status, location: EXPECTED_URL })).toBe(
      EXPECTED_URL,
    );
  });

  it.each([
    ['https://issoufi.fr', EXPECTED_URL],
    ['https://ISSOUFI.fr/', EXPECTED_URL],
    ['/en/', 'http://issoufi.fr/en/'],
    ['en/projects', 'http://issoufi.fr/en/projects'],
    ['//issoufi.fr/', 'http://issoufi.fr/'],
    ['https://issoufi.fr/é?a=1', 'https://issoufi.fr/%C3%A9?a=1'],
  ])('resolves the location %j as %j', (location, expected) => {
    expect(resolveRedirectUrl({ url: URL_HTTP, status: 301, location })).toBe(expected);
  });

  it.each([200, 204, 300, 304, 404, 500, 0, NaN, undefined, null, '301'])(
    'gives no address for the status %s',
    status => {
      expect(resolveRedirectUrl({ url: URL_HTTP, status, location: EXPECTED_URL })).toBe('');
    },
  );

  it.each([undefined, null, '', '  ', 'http://', 42])(
    'gives no address for the location %j',
    location => {
      expect(resolveRedirectUrl({ url: URL_HTTP, status: 301, location })).toBe('');
    },
  );

  it.each([undefined, '', 'not an address'])(
    'gives no address for a relative location from the address %j',
    url => {
      expect(resolveRedirectUrl({ url, status: 301, location: '/en/' })).toBe('');
    },
  );

  it('reads an absolute location without an address', () => {
    expect(resolveRedirectUrl({ status: 308, location: EXPECTED_URL })).toBe(EXPECTED_URL);
  });
});

describe('compareRedirect', () => {
  it.each(REDIRECT_STATUSES)('passes a %s redirect to the expected address', status => {
    expect(
      compareRedirect({ url: URL_HTTP, status, location: EXPECTED_URL, expectedUrl: EXPECTED_URL }),
    ).toEqual([]);
  });

  it('passes a location that only differs by its normalization', () => {
    expect(
      compareRedirect({
        url: URL_WWW,
        status: 301,
        location: 'https://ISSOUFI.fr',
        expectedUrl: EXPECTED_URL,
      }),
    ).toEqual([]);
  });

  it.each([
    [200, '200'],
    [404, '404'],
    [304, '304'],
    [undefined, 'unknown'],
    [NaN, 'unknown'],
    ['301', 'unknown'],
  ])('reports the status %s instead of a redirect', (status, shown) => {
    expect(
      compareRedirect({ url: URL_WWW, status, location: EXPECTED_URL, expectedUrl: EXPECTED_URL }),
    ).toEqual([`${URL_WWW}: status ${shown} instead of a redirect to ${EXPECTED_URL}`]);
  });

  it.each([null, undefined, '', '  ', 'http://'])(
    'reports a redirect to the location %j',
    location => {
      expect(
        compareRedirect({ url: URL_HTTP, status: 301, location, expectedUrl: EXPECTED_URL }),
      ).toEqual([`${URL_HTTP}: redirect without a valid location instead of ${EXPECTED_URL}`]);
    },
  );

  it.each([
    ['http://issoufi.fr/', 'http://issoufi.fr/'],
    ['https://issoufi.fr/en/', 'https://issoufi.fr/en/'],
    ['/', 'https://www.issoufi.fr/'],
    ['https://example.com/%7E', 'https://example.com/%7E'],
  ])('reports a redirect to %j elsewhere', (location, redirectUrl) => {
    expect(
      compareRedirect({ url: URL_WWW, status: 302, location, expectedUrl: EXPECTED_URL }),
    ).toEqual([`${URL_WWW}: redirects to "${redirectUrl}" instead of ${EXPECTED_URL}`]);
  });

  it.each([
    [undefined, EXPECTED_URL],
    ['', EXPECTED_URL],
    ['issoufi.fr', EXPECTED_URL],
    [URL_HTTP, undefined],
    [URL_HTTP, ''],
    [URL_HTTP, '/'],
  ])('reports the address %j and the expected address %j as invalid', (url, expectedUrl) => {
    expect(compareRedirect({ url, status: 301, location: EXPECTED_URL, expectedUrl })).toEqual([
      INVALID_ADDRESSES_PROBLEM,
    ]);
  });
});

describe('compareRedirectChain', () => {
  it('passes a first answer that redirects to the expected address', () => {
    expect(
      compareRedirectChain({
        answers: [{ url: URL_HTTP, status: 301, location: EXPECTED_URL }],
        expectedUrl: EXPECTED_URL,
      }),
    ).toEqual([]);
  });

  it('passes a first answer that redirects to the expected address, whatever follows', () => {
    expect(
      compareRedirectChain({
        answers: [WWW_ANSWER, { url: EXPECTED_URL, status: 301, location: URL_WWW }],
        expectedUrl: EXPECTED_URL,
      }),
    ).toEqual([]);
  });

  it('reports the expected address reached in the second redirect', () => {
    expect(
      compareRedirectChain({ answers: [HTTP_WWW_ANSWER, WWW_ANSWER], expectedUrl: EXPECTED_URL }),
    ).toEqual([TWO_HOPS_PROBLEM]);
  });

  it('names every address before the expected one, in order', () => {
    expect(
      compareRedirectChain({
        answers: [
          { url: URL_HTTP_WWW, status: 302, location: '/en/' },
          { url: 'http://www.issoufi.fr/en/', status: 308, location: URL_WWW },
          WWW_ANSWER,
        ],
        expectedUrl: EXPECTED_URL,
      }),
    ).toEqual([
      `${URL_HTTP_WWW}: reaches ${EXPECTED_URL} in 3 redirects instead of 1, through ` +
        `"http://www.issoufi.fr/en/", "${URL_WWW}"`,
    ]);
  });

  it('reports the first redirect of a chain that never reaches the expected address', () => {
    expect(
      compareRedirectChain({
        answers: [HTTP_WWW_ANSWER, { url: URL_WWW, status: 301, location: 'https://example.com/' }],
        expectedUrl: EXPECTED_URL,
      }),
    ).toEqual([WRONG_FIRST_HOP_PROBLEM]);
  });

  it.each([
    [200, null],
    [301, null],
    [301, ''],
    [404, EXPECTED_URL],
  ])(
    'reports the first redirect when a hop before the target answers %s with the location %j',
    (status, location) => {
      expect(
        compareRedirectChain({
          answers: [HTTP_WWW_ANSWER, { url: URL_WWW, status, location }, WWW_ANSWER],
          expectedUrl: EXPECTED_URL,
        }),
      ).toEqual([WRONG_FIRST_HOP_PROBLEM]);
    },
  );

  it.each([null, undefined])('reports the first redirect when a hop is %s', answer => {
    expect(
      compareRedirectChain({
        answers: [HTTP_WWW_ANSWER, answer, WWW_ANSWER],
        expectedUrl: EXPECTED_URL,
      }),
    ).toEqual([WRONG_FIRST_HOP_PROBLEM]);
  });

  it('reports a first answer that does not redirect, whatever follows', () => {
    expect(
      compareRedirectChain({
        answers: [{ url: URL_HTTP_WWW, status: 200, location: null }, WWW_ANSWER],
        expectedUrl: EXPECTED_URL,
      }),
    ).toEqual([`${URL_HTTP_WWW}: status 200 instead of a redirect to ${EXPECTED_URL}`]);
  });

  it.each([undefined, null, [], [null], [undefined], 'not a list'])(
    'reports the answers %j as a check without an address',
    answers => {
      expect(compareRedirectChain({ answers, expectedUrl: EXPECTED_URL })).toEqual([
        INVALID_ADDRESSES_PROBLEM,
      ]);
    },
  );

  it.each([
    [undefined, EXPECTED_URL],
    ['www.issoufi.fr', EXPECTED_URL],
    [URL_HTTP_WWW, undefined],
    [URL_HTTP_WWW, ''],
  ])(
    'reports the address %j and the expected address %j of a longer chain as invalid',
    (url, expectedUrl) => {
      expect(
        compareRedirectChain({
          answers: [{ ...HTTP_WWW_ANSWER, url }, WWW_ANSWER],
          expectedUrl,
        }),
      ).toEqual([INVALID_ADDRESSES_PROBLEM]);
    },
  );

  it('works without parameters', () => {
    expect(compareRedirectChain({})).toEqual([INVALID_ADDRESSES_PROBLEM]);
  });
});

describe('checkRedirect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * Replaces fetch with a stub that answers each address with its own answer, and with a 200 an
   * address missing from the answers.
   * @param {Record<string, { status?: number, location?: string } | Error>} answers - Answer of
   * each address, or the error its request fails with.
   */
  const stubFetchByUrl = answers => {
    const fetch = vi.fn(async url => {
      const answer = answers[url] ?? { status: 200 };
      if (answer instanceof Error) throw answer;
      const { status = 301, location } = answer;
      const headers = location === undefined ? {} : { Location: location };
      return new Response(status === 200 ? 'Page' : null, { status, headers });
    });
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };

  it('reports the expected address reached in two hops, without requesting it', async () => {
    const fetch = stubFetchByUrl({
      [URL_HTTP_WWW]: { location: URL_WWW },
      [URL_WWW]: { location: EXPECTED_URL },
    });
    await expect(checkRedirect({ url: URL_HTTP_WWW, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      TWO_HOPS_PROBLEM,
    ]);
    expect(fetch.mock.calls).toEqual([
      [URL_HTTP_WWW, { redirect: 'manual' }],
      [URL_WWW, { redirect: 'manual' }],
    ]);
  });

  it('follows a relative location from the address that sends it', async () => {
    stubFetchByUrl({
      [URL_HTTP_WWW]: { status: 302, location: URL_WWW },
      [URL_WWW]: { status: 307, location: 'en/' },
      'https://www.issoufi.fr/en/': { location: EXPECTED_URL },
    });
    await expect(checkRedirect({ url: URL_HTTP_WWW, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      `${URL_HTTP_WWW}: reaches ${EXPECTED_URL} in 3 redirects instead of 1, through ` +
        `"${URL_WWW}", "https://www.issoufi.fr/en/"`,
    ]);
  });

  it('reports the first redirect of a chain that ends elsewhere', async () => {
    const fetch = stubFetchByUrl({ [URL_HTTP_WWW]: { location: URL_WWW } });
    await expect(checkRedirect({ url: URL_HTTP_WWW, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      WRONG_FIRST_HOP_PROBLEM,
    ]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it(`stops a redirect loop after ${MAX_REDIRECT_HOPS} requests`, async () => {
    const fetch = stubFetchByUrl({
      [URL_HTTP_WWW]: { location: URL_WWW },
      [URL_WWW]: { location: URL_HTTP_WWW },
    });
    await expect(checkRedirect({ url: URL_HTTP_WWW, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      WRONG_FIRST_HOP_PROBLEM,
    ]);
    expect(fetch).toHaveBeenCalledTimes(MAX_REDIRECT_HOPS);
  });

  it.each([
    [MAX_REDIRECT_HOPS, `reaches ${EXPECTED_URL} in ${MAX_REDIRECT_HOPS} redirects instead of 1`],
    [MAX_REDIRECT_HOPS + 1, `redirects to "${URL_WWW}1" instead of ${EXPECTED_URL}`],
  ])('follows a chain of %s redirects up to the limit', async (redirectCount, problem) => {
    const chainUrls = Array.from({ length: redirectCount }, (_, index) => `${URL_WWW}${index}`);
    const fetch = stubFetchByUrl(
      Object.fromEntries(
        chainUrls.map((url, index) => [url, { location: chainUrls[index + 1] ?? EXPECTED_URL }]),
      ),
    );
    const [result] = await checkRedirect({ url: chainUrls[0], expectedUrl: EXPECTED_URL });
    expect(result).toMatch(`${URL_WWW}0: ${problem}`);
    expect(fetch).toHaveBeenCalledTimes(MAX_REDIRECT_HOPS);
  });

  it('reports the first redirect when a later request fails', async () => {
    stubFetchByUrl({
      [URL_HTTP_WWW]: { location: URL_WWW },
      [URL_WWW]: new TypeError('fetch failed'),
    });
    await expect(checkRedirect({ url: URL_HTTP_WWW, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      WRONG_FIRST_HOP_PROBLEM,
    ]);
  });

  it('does not follow an answer that does not redirect', async () => {
    const fetch = stubFetchByUrl({ [URL_WWW]: { status: 200 } });
    await expect(checkRedirect({ url: URL_WWW, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      `${URL_WWW}: status 200 instead of a redirect to ${EXPECTED_URL}`,
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  /**
   * Replaces fetch with a stub that answers every request with the given answer.
   * @param {{ status?: number, location?: string, body?: string }} answer
   */
  const stubFetch = ({ status = 301, location, body = 'Moved' } = {}) => {
    const headers = location === undefined ? {} : { Location: location };
    const fetch = vi.fn(async () => new Response(body, { status, headers }));
    vi.stubGlobal('fetch', fetch);
    return fetch;
  };

  it('requests the address without following its redirect', async () => {
    const fetch = stubFetch({ location: EXPECTED_URL });
    await expect(checkRedirect({ url: URL_HTTP, expectedUrl: EXPECTED_URL })).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith(URL_HTTP, { redirect: 'manual' });
  });

  it('reports a redirect elsewhere', async () => {
    const fetch = stubFetchByUrl({ [URL_WWW]: { status: 302, location: 'https://example.com/' } });
    await expect(checkRedirect({ url: URL_WWW, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      `${URL_WWW}: redirects to "https://example.com/" instead of ${EXPECTED_URL}`,
    ]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('reports an answer that does not redirect', async () => {
    stubFetch({ status: 200, body: '<title>Issoufi</title>' });
    await expect(checkRedirect({ url: URL_WWW, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      `${URL_WWW}: status 200 instead of a redirect to ${EXPECTED_URL}`,
    ]);
  });

  it('reads a redirect without a body', async () => {
    const fetch = vi.fn(
      async () => new Response(null, { status: 308, headers: { Location: EXPECTED_URL } }),
    );
    vi.stubGlobal('fetch', fetch);
    await expect(checkRedirect({ url: URL_HTTP, expectedUrl: EXPECTED_URL })).resolves.toEqual([]);
  });

  it('reports a failed request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );
    await expect(checkRedirect({ url: URL_HTTP, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      `${URL_HTTP}: request failed (fetch failed)`,
    ]);
  });

  it('reports a failure that is not an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw 'offline';
      }),
    );
    await expect(checkRedirect({ url: URL_HTTP, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      `${URL_HTTP}: request failed (offline)`,
    ]);
  });

  it.each([
    [undefined, EXPECTED_URL],
    ['issoufi.fr', EXPECTED_URL],
    [URL_HTTP, undefined],
  ])(
    'reports the address %j and the expected address %j without a request',
    async (url, expectedUrl) => {
      const fetch = stubFetch({ location: EXPECTED_URL });
      await expect(checkRedirect({ url, expectedUrl })).resolves.toEqual([
        INVALID_ADDRESSES_PROBLEM,
      ]);
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
