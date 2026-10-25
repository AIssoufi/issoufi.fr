// @vitest-environment node
import { rmSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';

import { NOT_FOUND_PAGE_MEDIA_TYPE } from '../constants.ts';
import { BUILD_FILES, HEADERS, serve, writeBuild } from '../previewTestUtils.ts';
import { createNotFoundMiddleware } from './notFoundPages.ts';

describe('createNotFoundMiddleware', () => {
  let projectDir = '';
  let root = '';

  beforeEach(() => {
    ({ projectDir, root } = writeBuild());
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it.each([
    ['/nope', '404.html'],
    ['/Projects', '404.html'],
    ['/PROJECTS.html', '404.html'],
    ['/EN/', '404.html'],
    ['/nope?a=1', '404.html'],
    ['/en/nope', 'en/404.html'],
    ['/en/a/b', 'en/404.html'],
    ['/en/Projects', 'en/404.html'],
    ['/Assets/index-a1b2.js', '404.html'],
  ])('answers %s with %s and the status 404', (url, notFoundPage) => {
    const middleware = createNotFoundMiddleware({ root, headers: HEADERS });

    const answer = serve({ middleware, url });

    expect(answer.isPassed).toBe(false);
    expect(answer.statusCode).toBe(404);
    expect(String(answer.body)).toBe(BUILD_FILES[notFoundPage]);
    expect(answer.headers.get('Content-Type')).toBe(NOT_FOUND_PAGE_MEDIA_TYPE);
  });

  it('sends the headers of the preview with the not found page', () => {
    const middleware = createNotFoundMiddleware({
      root,
      headers: { ...HEADERS, 'X-Missing': undefined },
    });

    const { headers } = serve({ middleware, url: '/nope' });

    expect(Object.fromEntries(headers)).toEqual({
      ...HEADERS,
      'Content-Type': NOT_FOUND_PAGE_MEDIA_TYPE,
    });
  });

  it('sends only its media type without headers', () => {
    const middleware = createNotFoundMiddleware({ root });

    const { headers } = serve({ middleware, url: '/nope' });

    expect(Object.fromEntries(headers)).toEqual({ 'Content-Type': NOT_FOUND_PAGE_MEDIA_TYPE });
  });

  it('answers a HEAD request as a GET request', () => {
    const middleware = createNotFoundMiddleware({ root });

    const answer = serve({ middleware, url: '/nope', method: 'HEAD' });

    expect(answer.statusCode).toBe(404);
    expect(String(answer.body)).toBe(BUILD_FILES['404.html']);
  });

  it.each([
    '/',
    '/index.html',
    '/projects',
    '/projects.html',
    '/projects/',
    '/en',
    '/en/',
    '/en/index.html',
    '/404',
    '/404.html',
    '/en/404',
    '/assets/index-a1b2.js',
    '/projects?a=1',
  ])('leaves %s, which names a file, to Vite', url => {
    const middleware = createNotFoundMiddleware({ root, headers: HEADERS });

    const answer = serve({ middleware, url });

    expect(answer.isPassed).toBe(true);
    expect(answer.statusCode).toBe(200);
    expect(answer.headers.size).toBe(0);
    expect(answer.body).toBeUndefined();
  });

  it.each(['POST', 'PUT', 'DELETE', 'OPTIONS', ''])('leaves a %s request to Vite', method => {
    const middleware = createNotFoundMiddleware({ root });

    expect(serve({ middleware, url: '/nope', method }).isPassed).toBe(true);
  });

  it.each([undefined, null, 404, '', '*', '/%E0%A4%A'])(
    'leaves the URL %s, which names no path, to Vite',
    url => {
      const middleware = createNotFoundMiddleware({ root });

      expect(serve({ middleware, url }).isPassed).toBe(true);
    },
  );

  it('leaves a request without a method to Vite', () => {
    const middleware = createNotFoundMiddleware({ root });
    const next = vi.fn();

    middleware({ url: '/nope' } as IncomingMessage, {} as ServerResponse, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('leaves to Vite a path with no not found page up its folders', () => {
    rmSync(join(root, '404.html'));
    const middleware = createNotFoundMiddleware({ root });

    expect(serve({ middleware, url: '/nope' }).isPassed).toBe(true);
    expect(serve({ middleware, url: '/en/nope' }).statusCode).toBe(404);
  });

  it('leaves every request to Vite without a build', () => {
    const middleware = createNotFoundMiddleware({ root: join(projectDir, 'missing') });

    expect(serve({ middleware, url: '/nope' }).isPassed).toBe(true);
    expect(serve({ middleware, url: '/' }).isPassed).toBe(true);
  });
});
