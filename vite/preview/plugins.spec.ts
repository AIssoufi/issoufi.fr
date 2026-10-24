// @vitest-environment node
import { rmSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';

import type { Connect, PreviewServer } from 'vite';

import { HASHED_ASSET_MAX_AGE_SECONDS } from '../constants.ts';
import {
  CACHE_HEADERS_PLUGIN_NAME,
  CANONICAL_REDIRECT_STATUS,
  CLOUDFLARE_ROUTES_PLUGIN_NAME,
  NOT_FOUND_PAGE_MEDIA_TYPE,
  NOT_FOUND_PAGES_PLUGIN_NAME,
} from './constants.ts';
import {
  cacheHeaders,
  cloudflareRoutes,
  createCloudflareRoutesMiddleware,
  notFoundPages,
} from './plugins.ts';
import { BUILD_FILES, HEADERS, OUT_DIR, serve, writeBuild } from './previewTestUtils.ts';

describe('with a build', () => {
  let projectDir = '';
  let root = '';

  beforeEach(() => {
    ({ projectDir, root } = writeBuild());
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  /** Runs the hook of a plugin on a fake preview server, and returns the middleware it adds. */
  const configurePreviewServer = ({
    plugin = notFoundPages(),
    outDir = OUT_DIR,
    headers = HEADERS,
  } = {}) => {
    const { configurePreviewServer: hook } = plugin;
    if (typeof hook !== 'function')
      throw new Error('The plugin has no configurePreviewServer hook');
    const use = vi.fn();
    const server = {
      config: {
        root: projectDir,
        environments: { client: { build: { outDir } } },
        preview: { headers },
      },
      middlewares: { use },
    };
    // The hook reads no `this`, which only Vite would give it
    void hook.call(undefined as never, server as unknown as PreviewServer);
    expect(use).toHaveBeenCalledOnce();
    return use.mock.calls[0][0] as Connect.NextHandleFunction;
  };

  describe('notFoundPages', () => {
    it('has a name', () => {
      expect(notFoundPages().name).toBe(NOT_FOUND_PAGES_PLUGIN_NAME);
    });

    it('serves the not found pages of the build of the client', () => {
      const middleware = configurePreviewServer();

      const answer = serve({ middleware, url: '/en/nope' });

      expect(answer.statusCode).toBe(404);
      expect(String(answer.body)).toBe(BUILD_FILES['en/404.html']);
      expect(answer.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('reads an absolute build folder', () => {
      const middleware = configurePreviewServer({ outDir: root, headers: {} });

      const answer = serve({ middleware, url: '/nope' });

      expect(String(answer.body)).toBe(BUILD_FILES['404.html']);
      expect(Object.fromEntries(answer.headers)).toEqual({
        'Content-Type': NOT_FOUND_PAGE_MEDIA_TYPE,
      });
    });

    it('leaves every request to Vite when the build folder is elsewhere', () => {
      const middleware = configurePreviewServer({ outDir: 'build' });

      expect(serve({ middleware, url: '/nope' }).isPassed).toBe(true);
    });
  });

  describe('cacheHeaders', () => {
    it('has a name', () => {
      expect(cacheHeaders().name).toBe(CACHE_HEADERS_PLUGIN_NAME);
    });

    it('gives the files of the build of the client their policy', () => {
      const middleware = configurePreviewServer({ plugin: cacheHeaders() });

      const answer = serve({ middleware, url: '/assets/index-a1b2.js' });

      expect(answer.isPassed).toBe(true);
      expect(Object.fromEntries(answer.headers)).toEqual({
        'Cache-Control': `public, max-age=${HASHED_ASSET_MAX_AGE_SECONDS}, immutable`,
      });
    });

    it('reads an absolute build folder', () => {
      const middleware = configurePreviewServer({ plugin: cacheHeaders(), outDir: root });

      expect(serve({ middleware, url: '/assets/index-a1b2.js' }).headers.size).toBe(1);
    });

    it('leaves every request to Vite unchanged when the build folder is elsewhere', () => {
      const middleware = configurePreviewServer({ plugin: cacheHeaders(), outDir: 'build' });

      const answer = serve({ middleware, url: '/assets/index-a1b2.js' });

      expect(answer.isPassed).toBe(true);
      expect(answer.headers.size).toBe(0);
    });
  });

  describe('createCloudflareRoutesMiddleware', () => {
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
    });
  });

  describe('cloudflareRoutes', () => {
    it('has a name', () => {
      expect(cloudflareRoutes().name).toBe(CLOUDFLARE_ROUTES_PLUGIN_NAME);
    });

    it('redirects in the build of the client, with the headers of the preview', () => {
      const middleware = configurePreviewServer({ plugin: cloudflareRoutes() });

      const answer = serve({ middleware, url: '/en' });

      expect(answer.statusCode).toBe(CANONICAL_REDIRECT_STATUS);
      expect(Object.fromEntries(answer.headers)).toEqual({ ...HEADERS, Location: '/en/' });
    });

    it('reads an absolute build folder', () => {
      const middleware = configurePreviewServer({ plugin: cloudflareRoutes(), outDir: root });

      expect(serve({ middleware, url: '/en' }).statusCode).toBe(CANONICAL_REDIRECT_STATUS);
    });

    it('redirects nothing when the build folder is elsewhere', () => {
      const middleware = configurePreviewServer({ plugin: cloudflareRoutes(), outDir: 'build' });

      expect(serve({ middleware, url: '/en' }).isPassed).toBe(true);
    });
  });
});
