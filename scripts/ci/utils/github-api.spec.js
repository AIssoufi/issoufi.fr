import { getRepositoryApiUrl, requestGitHub, requestRepositoryApi } from './github-api.mjs';

const URL_OF_PULLS = 'https://api.github.com/repos/AIssoufi/issoufi.fr/pulls';

/** Answers every request with the given status and body, written as is. */
const stubFetch = ({ status = 200, body = '{"ok":true}' } = {}) => {
  const fetch = vi.fn(async () => new Response(body, { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('getRepositoryApiUrl', () => {
  it('builds the address of an endpoint of the repository, with its query', () => {
    expect(
      getRepositoryApiUrl({
        repository: 'AIssoufi/issoufi.fr',
        path: '/pulls',
        query: { state: 'open', base: 'develop' },
      }),
    ).toBe(`${URL_OF_PULLS}?state=open&base=develop`);
  });

  it('addresses the repository itself without a path, and adds no query without one', () => {
    expect(getRepositoryApiUrl({ repository: 'owner/repo' })).toBe(
      'https://api.github.com/repos/owner/repo',
    );
  });

  it('keeps the path of another API', () => {
    expect(
      getRepositoryApiUrl({
        apiUrl: 'https://example.com/api/v3/',
        repository: 'owner/repo',
        path: '/actions/runs/1',
      }),
    ).toBe('https://example.com/api/v3/repos/owner/repo/actions/runs/1');
  });

  it('encodes the query', () => {
    expect(getRepositoryApiUrl({ repository: 'owner/repo', query: { head: 'feature/a&b' } })).toBe(
      'https://api.github.com/repos/owner/repo?head=feature%2Fa%26b',
    );
  });

  it.each([
    { repository: undefined },
    { repository: '' },
    { repository: 'issoufi.fr' },
    { repository: 'owner/repo/extra' },
    { repository: '../owner/repo' },
    { repository: 42 },
    { apiUrl: 'not a url' },
    { apiUrl: '' },
  ])('returns undefined for %o', fields => {
    expect(getRepositoryApiUrl({ repository: 'owner/repo', ...fields })).toBeUndefined();
  });
});

describe('requestGitHub', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_TOKEN', 'token');
  });

  it('reads an endpoint with the token of the workflow', async () => {
    const fetch = stubFetch({ body: '[{"number":1}]' });
    await expect(requestGitHub({ url: URL_OF_PULLS })).resolves.toEqual([{ number: 1 }]);
    expect(fetch).toHaveBeenCalledWith(URL_OF_PULLS, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        Authorization: 'Bearer token',
      },
    });
  });

  it('sends a body as JSON, with another method and token', async () => {
    const fetch = stubFetch();
    await requestGitHub({ url: URL_OF_PULLS, method: 'PUT', body: { a: 1 }, token: 'other' });
    const [, init] = fetch.mock.calls[0];
    expect(init.method).toBe('PUT');
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer other',
    });
  });

  it('sends an anonymous request without a token', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    const fetch = stubFetch();
    await requestGitHub({ url: URL_OF_PULLS });
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it.each([
    [204, null],
    [200, ''],
  ])('resolves to undefined for an answer %i without a body', async (status, body) => {
    stubFetch({ status, body });
    await expect(requestGitHub({ url: URL_OF_PULLS })).resolves.toBeUndefined();
  });

  it('throws with the message of the API when it answers an error', async () => {
    stubFetch({ status: 405, body: '{"message":"Pull Request is not mergeable"}' });
    await expect(requestGitHub({ url: URL_OF_PULLS })).rejects.toThrow(
      `The GitHub API answered 405 to ${URL_OF_PULLS}: Pull Request is not mergeable`,
    );
  });

  it.each(['', 'not json', '{"message":""}', '{"message":42}', 'null'])(
    'throws without a message when the error body is %o',
    async body => {
      stubFetch({ status: 500, body });
      await expect(requestGitHub({ url: URL_OF_PULLS })).rejects.toThrow(
        new Error(`The GitHub API answered 500 to ${URL_OF_PULLS}`),
      );
    },
  );

  it('throws when a successful answer is not JSON', async () => {
    stubFetch({ body: '<html>' });
    await expect(requestGitHub({ url: URL_OF_PULLS })).rejects.toThrow(
      `The GitHub API answered ${URL_OF_PULLS} with a body that is not JSON`,
    );
  });
});

describe('requestRepositoryApi', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_API_URL', 'https://api.github.com');
    vi.stubEnv('GITHUB_REPOSITORY', 'AIssoufi/issoufi.fr');
    vi.stubEnv('GITHUB_TOKEN', 'token');
  });

  it('requests an endpoint of the repository of the workflow', async () => {
    const fetch = stubFetch();
    await expect(
      requestRepositoryApi({ path: '/pulls', query: { state: 'open' }, method: 'POST', body: {} }),
    ).resolves.toEqual({ ok: true });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${URL_OF_PULLS}?state=open`);
    expect(init).toMatchObject({ method: 'POST', body: '{}' });
  });

  it('defaults to the public API, and takes another repository and token', async () => {
    vi.stubEnv('GITHUB_API_URL', '');
    const fetch = stubFetch();
    await requestRepositoryApi({ repository: 'owner/repo', token: 'other', path: '/pulls' });
    const [url, { headers }] = fetch.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/owner/repo/pulls');
    expect(headers.Authorization).toBe('Bearer other');
  });

  it.each(['', 'issoufi.fr'])('throws without asking the API for the repository %o', async repo => {
    vi.stubEnv('GITHUB_REPOSITORY', repo);
    const fetch = stubFetch();
    await expect(requestRepositoryApi({ path: '/pulls' })).rejects.toThrow(
      `Cannot reach the GitHub API of the repository "${repo}"`,
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
