import { REDIRECT_STATUSES } from '../constants.mjs';
import { checkRedirect, compareRedirect, resolveRedirectUrl } from './redirects.mjs';

const URL_HTTP = 'http://issoufi.fr/';
const URL_WWW = 'https://www.issoufi.fr/';
const EXPECTED_URL = 'https://issoufi.fr/';
const INVALID_ADDRESSES_PROBLEM =
  'A redirect check without a valid address and expected address cannot be compared';

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

describe('checkRedirect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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
    stubFetch({ status: 302, location: 'https://example.com/' });
    await expect(checkRedirect({ url: URL_WWW, expectedUrl: EXPECTED_URL })).resolves.toEqual([
      `${URL_WWW}: redirects to "https://example.com/" instead of ${EXPECTED_URL}`,
    ]);
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
