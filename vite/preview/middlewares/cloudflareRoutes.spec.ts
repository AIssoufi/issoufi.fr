// @vitest-environment node
import { rmSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';

import { CANONICAL_REDIRECT_STATUS, NOT_FOUND_PAGE_MEDIA_TYPE } from '../constants.ts';
import { BUILD_FILES, HEADERS, serve, writeBuild } from '../previewTestUtils.ts';
import { createCloudflareRoutesMiddleware } from './cloudflareRoutes.ts';

describe('createCloudflareRoutesMiddleware', () => {
  let projectDir = '';
  let root = '';

  beforeEach(() => {
    ({ projectDir, root } = writeBuild());
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it.each([
    ['/en', '/en/'],
    ['/en/index', '/en/'],
    ['/en/index.html', '/en/'],
    ['/index', '/'],
    ['/index.html', '/'],
    ['/projects/', '/projects'],
    ['/projects.html', '/projects'],
    ['/404.html', '/404'],
    ['/en/404.html', '/en/404'],
    ['/pro%6Aects/', '/projects'],
    ['/en?a=1', '/en/?a=1'],
    ['/projects.html?a=1&b=2', '/projects?a=1&b=2'],
  ])('redirects %s to %s with the status 308', (url, location) => {
    const middleware = createCloudflareRoutesMiddleware({ root, headers: HEADERS });

    const answer = serve({ middleware, url });

    expect(answer.isPassed).toBe(false);
    expect(answer.statusCode).toBe(CANONICAL_REDIRECT_STATUS);
    expect(answer.headers.get('Location')).toBe(location);
    expect(answer.body).toBeUndefined();
  });

  it('sends the headers of the preview with a redirect', () => {
    const middleware = createCloudflareRoutesMiddleware({
      root,
      headers: { ...HEADERS, 'X-Missing': undefined },
    });

    const { headers } = serve({ middleware, url: '/en' });

    expect(Object.fromEntries(headers)).toEqual({ ...HEADERS, Location: '/en/' });
  });

  it('sends only its location without headers', () => {
    const middleware = createCloudflareRoutesMiddleware({ root });

    const { headers } = serve({ middleware, url: '/projects/' });

    expect(Object.fromEntries(headers)).toEqual({ Location: '/projects' });
  });

  it('redirects a HEAD request as a GET request', () => {
    const middleware = createCloudflareRoutesMiddleware({ root });

    const answer = serve({ middleware, url: '/en', method: 'HEAD' });

    expect(answer.statusCode).toBe(CANONICAL_REDIRECT_STATUS);
    expect(answer.headers.get('Location')).toBe('/en/');
  });

  it.each([
    ['/code', 302, 'https://example.com/code'],
    ['/code?a=1', 302, 'https://example.com/code?a=1'],
    ['/moved', 301, '/en/'],
  ])('redirects %s with the status %i to %s, from _redirects', (url, status, location) => {
    const middleware = createCloudflareRoutesMiddleware({ root, headers: HEADERS });

    const answer = serve({ middleware, url });

    expect(answer.isPassed).toBe(false);
    expect(answer.statusCode).toBe(status);
    expect(Object.fromEntries(answer.headers)).toEqual({ ...HEADERS, Location: location });
    expect(answer.body).toBeUndefined();
  });

  it.each(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', ''])(
    'redirects a %s request from _redirects, as Cloudflare Pages does',
    method => {
      const middleware = createCloudflareRoutesMiddleware({ root });

      const answer = serve({ middleware, url: '/code', method });

      expect(answer.statusCode).toBe(302);
      expect(answer.headers.get('Location')).toBe('https://example.com/code');
    },
  );

  it('prefers a redirect of _redirects to the file of its source', () => {
    writeFileSync(join(root, '_redirects'), '/projects /en/ 302\n');
    const middleware = createCloudflareRoutesMiddleware({ root });

    const answer = serve({ middleware, url: '/projects' });

    expect(answer.statusCode).toBe(302);
    expect(answer.headers.get('Location')).toBe('/en/');
  });

  it('reads _redirects again for each request, as the other files of the build', () => {
    const middleware = createCloudflareRoutesMiddleware({ root });
    expect(serve({ middleware, url: '/code' }).statusCode).toBe(302);

    rmSync(join(root, '_redirects'));

    expect(serve({ middleware, url: '/code' }).isPassed).toBe(true);
  });

  it('leaves every request to the next middlewares from an empty _redirects', () => {
    writeFileSync(join(root, '_redirects'), '');
    const middleware = createCloudflareRoutesMiddleware({ root });

    expect(serve({ middleware, url: '/code' }).isPassed).toBe(true);
  });

  it.each(['/_headers', '/_redirects', '/_headers?a=1'])(
    'answers %s with the not found page and the status 404',
    url => {
      const middleware = createCloudflareRoutesMiddleware({ root, headers: HEADERS });

      const answer = serve({ middleware, url });

      expect(answer.isPassed).toBe(false);
      expect(answer.statusCode).toBe(404);
      expect(String(answer.body)).toBe(BUILD_FILES['404.html']);
      expect(Object.fromEntries(answer.headers)).toEqual({
        ...HEADERS,
        'Content-Type': NOT_FOUND_PAGE_MEDIA_TYPE,
      });
    },
  );

  it('answers a configuration file with the status 404 alone without a not found page', () => {
    rmSync(join(root, '404.html'));
    const middleware = createCloudflareRoutesMiddleware({ root, headers: HEADERS });

    const answer = serve({ middleware, url: '/_headers' });

    expect(answer.isPassed).toBe(false);
    expect(answer.statusCode).toBe(404);
    expect(answer.body).toBeUndefined();
    expect(Object.fromEntries(answer.headers)).toEqual(HEADERS);
  });

  it.each([
    '/',
    '/en/',
    '/projects',
    '/en/projects',
    '/404',
    '/assets/index-a1b2.js',
    '/projects?a=1',
    '/nope',
    '/nope/',
    '/Projects/',
    '/index.html/',
    '/projects.html/',
    '/en/_headers',
    '/_Headers',
    '/_headers/',
    '/code/',
    '/Code',
    '/c%6Fde',
    '/en/code',
  ])('leaves %s to the next middlewares', url => {
    const middleware = createCloudflareRoutesMiddleware({ root, headers: HEADERS });

    const answer = serve({ middleware, url });

    expect(answer.isPassed).toBe(true);
    expect(answer.statusCode).toBe(200);
    expect(answer.headers.size).toBe(0);
    expect(answer.body).toBeUndefined();
  });

  it.each(['POST', 'PUT', 'DELETE', 'OPTIONS', ''])('leaves a %s request to Vite', method => {
    const middleware = createCloudflareRoutesMiddleware({ root });

    expect(serve({ middleware, url: '/en', method }).isPassed).toBe(true);
    expect(serve({ middleware, url: '/_headers', method }).isPassed).toBe(true);
  });

  it.each([undefined, null, 404, '', '*', '/%E0%A4%A'])(
    'leaves the URL %s, which names no path, to Vite',
    url => {
      const middleware = createCloudflareRoutesMiddleware({ root });

      expect(serve({ middleware, url }).isPassed).toBe(true);
    },
  );

  it('leaves a request without a method to Vite', () => {
    const middleware = createCloudflareRoutesMiddleware({ root });
    const next = vi.fn();

    middleware({ url: '/en' } as IncomingMessage, {} as ServerResponse, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('redirects nothing without a build', () => {
    const middleware = createCloudflareRoutesMiddleware({ root: join(projectDir, 'missing') });

    expect(serve({ middleware, url: '/en' }).isPassed).toBe(true);
    expect(serve({ middleware, url: '/projects.html' }).isPassed).toBe(true);
    expect(serve({ middleware, url: '/code' }).isPassed).toBe(true);
  });
});
