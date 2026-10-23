import { REPOSITORY, routesOf, stubGitHub, stubGitHubEnv } from './testUtils.js';

const API = `https://api.github.com/repos/${REPOSITORY}`;

/** Requests made to a route of three answers: one more, to see its last answer served again. */
const QUEUE_REQUEST_COUNT = 4;

/** Reads the status and the body of a response of the stub. */
const read = async response => ({ status: response.status, text: await response.text() });

describe('stubGitHubEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('sets the address of the API, the repository and a token', () => {
    stubGitHubEnv();

    expect(process.env.GITHUB_API_URL).toBe('https://api.github.com');
    expect(process.env.GITHUB_REPOSITORY).toBe(REPOSITORY);
    expect(process.env.GITHUB_TOKEN).toBe('token');
  });
});

describe('stubGitHub', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers a route with its body, as JSON, and a status of 200 by default', async () => {
    stubGitHub({ 'GET /pulls/162': [{ body: { number: 162 } }] });

    expect(await read(await fetch(`${API}/pulls/162`))).toEqual({
      status: 200,
      text: '{"number":162}',
    });
  });

  it('answers with the status of the route and no body when it gives none', async () => {
    stubGitHub({ 'POST /actions/runs/501/approve': [{ status: 201 }] });

    expect(await read(await fetch(`${API}/actions/runs/501/approve`, { method: 'POST' }))).toEqual({
      status: 201,
      text: '',
    });
  });

  it('serves the answers of a route in their order, then repeats the last one', async () => {
    stubGitHub({ 'GET /pulls/162': [{ status: 500 }, { status: 403 }, { status: 200 }] });

    const statuses = [];
    for (let request = 0; request < QUEUE_REQUEST_COUNT; request += 1) {
      statuses.push((await fetch(`${API}/pulls/162`)).status);
    }

    expect(statuses).toEqual([500, 403, 200, 200]);
  });

  it.each([
    ['without a route', {}],
    ['whose route has no answer', { 'GET /pulls': [] }],
  ])('answers a request %s with a 404', async (_case, routes) => {
    stubGitHub(routes);

    expect(await read(await fetch(`${API}/pulls`))).toEqual({
      status: 404,
      text: '{"message":"Not Found"}',
    });
  });

  it('fails the request with the rejection of its answer', async () => {
    stubGitHub({ 'GET /pulls': [{ rejection: new TypeError('fetch failed') }] });

    await expect(fetch(`${API}/pulls`)).rejects.toThrow('fetch failed');
  });

  it('fails the request with a rejection that is not an error', async () => {
    stubGitHub({ 'GET /pulls': [{ rejection: 'offline' }] });

    await expect(fetch(`${API}/pulls`)).rejects.toBe('offline');
  });

  it('records each request with its route, its address and its body read as JSON', async () => {
    const requests = stubGitHub({});

    await fetch(`${API}/pulls?state=open&base=develop`);
    await fetch(`${API}/pulls/162/merge`, { method: 'PUT', body: '{"sha":"58ff9ea"}' });
    await fetch('https://api.github.com/rate_limit');

    expect(requests).toEqual([
      { route: 'GET /pulls', url: `${API}/pulls?state=open&base=develop`, body: undefined },
      { route: 'PUT /pulls/162/merge', url: `${API}/pulls/162/merge`, body: { sha: '58ff9ea' } },
      { route: 'GET /rate_limit', url: 'https://api.github.com/rate_limit', body: undefined },
    ]);
  });
});

describe('routesOf', () => {
  it('lists the routes of the requests in their order', () => {
    const requests = [
      { route: 'GET /pulls', url: `${API}/pulls`, body: undefined },
      { route: 'GET /pulls/162', url: `${API}/pulls/162`, body: undefined },
    ];

    expect(routesOf(requests)).toEqual(['GET /pulls', 'GET /pulls/162']);
  });

  it('lists no route without requests', () => {
    expect(routesOf([])).toEqual([]);
  });
});
