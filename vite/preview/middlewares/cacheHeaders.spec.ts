// @vitest-environment node
import { rmSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';

import { HASHED_ASSET_MAX_AGE_SECONDS } from '../../constants.ts';
import type { HeaderRule } from '../../types.ts';
import { serve, writeBuild } from '../previewTestUtils.ts';
import { createCacheHeadersMiddleware } from './cacheHeaders.ts';

describe('createCacheHeadersMiddleware', () => {
  let projectDir = '';
  let root = '';

  beforeEach(() => {
    ({ projectDir, root } = writeBuild());
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  /** Rules that give a policy to the pages and another to the files of `assets/`. */
  const RULES: HeaderRule[] = [
    { path: '/*', headers: { 'Cache-Control': 'public' } },
    { path: '/assets/*', headers: { 'Cache-Control': 'immutable' } },
  ];

  it.each([
    ['/assets/index-a1b2.js', 'public, immutable'],
    ['/assets/index-a1b2.js?v=1', 'public, immutable'],
    ['/projects', 'public'],
    ['/projects.html', 'public'],
    ['/en/', 'public'],
    ['/', 'public'],
  ])('gives %s, a file of the build, the policy %s', (url, cacheControl) => {
    const middleware = createCacheHeadersMiddleware({ root, rules: RULES });

    const answer = serve({ middleware, url });

    expect(answer.isPassed).toBe(true);
    expect(Object.fromEntries(answer.headers)).toEqual({ 'Cache-Control': cacheControl });
    expect(answer.statusCode).toBe(200);
    expect(answer.body).toBeUndefined();
  });

  it('gives the hashed files the policy of HEADER_RULES by default', () => {
    const middleware = createCacheHeadersMiddleware({ root });

    const answer = serve({ middleware, url: '/assets/index-a1b2.js', method: 'HEAD' });

    expect(answer.headers.get('Cache-Control')).toBe(
      `public, max-age=${HASHED_ASSET_MAX_AGE_SECONDS}, immutable`,
    );
    expect(serve({ middleware, url: '/projects' }).headers.size).toBe(0);
  });

  it.each(['/assets/nope.js', '/assets/INDEX-a1b2.js', '/Projects', '/nope', '/assets/'])(
    'leaves %s, which names no file, to Vite unchanged',
    url => {
      const middleware = createCacheHeadersMiddleware({ root, rules: RULES });

      const answer = serve({ middleware, url });

      expect(answer.isPassed).toBe(true);
      expect(answer.headers.size).toBe(0);
    },
  );

  it('leaves a file that no rule gives a policy to Vite unchanged', () => {
    const middleware = createCacheHeadersMiddleware({ root, rules: [RULES[1]] });

    const answer = serve({ middleware, url: '/projects' });

    expect(answer.isPassed).toBe(true);
    expect(answer.headers.size).toBe(0);
  });

  it.each(['POST', 'PUT', 'DELETE', 'OPTIONS', ''])('leaves a %s request to Vite', method => {
    const middleware = createCacheHeadersMiddleware({ root, rules: RULES });

    const answer = serve({ middleware, url: '/assets/index-a1b2.js', method });

    expect(answer.isPassed).toBe(true);
    expect(answer.headers.size).toBe(0);
  });

  it.each([undefined, null, 404, '', '*', '/%E0%A4%A'])(
    'leaves the URL %s, which names no path, to Vite',
    url => {
      const middleware = createCacheHeadersMiddleware({ root, rules: RULES });

      const answer = serve({ middleware, url });

      expect(answer.isPassed).toBe(true);
      expect(answer.headers.size).toBe(0);
    },
  );

  it('leaves a request without a method to Vite', () => {
    const middleware = createCacheHeadersMiddleware({ root, rules: RULES });
    const next = vi.fn();

    middleware({ url: '/projects' } as IncomingMessage, {} as ServerResponse, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('leaves every request to Vite unchanged without a build', () => {
    const middleware = createCacheHeadersMiddleware({
      root: join(projectDir, 'missing'),
      rules: RULES,
    });

    const answer = serve({ middleware, url: '/assets/index-a1b2.js' });

    expect(answer.isPassed).toBe(true);
    expect(answer.headers.size).toBe(0);
  });
});
