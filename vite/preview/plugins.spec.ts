// @vitest-environment node
import { rmSync } from 'node:fs';

import type { Connect, PreviewServer } from 'vite';

import { HASHED_ASSET_MAX_AGE_SECONDS } from '../constants.ts';
import {
  CACHE_HEADERS_PLUGIN_NAME,
  CANONICAL_REDIRECT_STATUS,
  CLOUDFLARE_ROUTES_PLUGIN_NAME,
  NOT_FOUND_PAGE_MEDIA_TYPE,
  NOT_FOUND_PAGES_PLUGIN_NAME,
} from './constants.ts';
import { cacheHeaders, cloudflareRoutes, notFoundPages } from './plugins.ts';
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

    it('answers the redirects of _redirects, with the headers of the preview', () => {
      const middleware = configurePreviewServer({ plugin: cloudflareRoutes() });

      const answer = serve({ middleware, url: '/code?a=1' });

      expect(answer.statusCode).toBe(302);
      expect(Object.fromEntries(answer.headers)).toEqual({
        ...HEADERS,
        Location: 'https://example.com/code?a=1',
      });
    });

    it('reads an absolute build folder', () => {
      const middleware = configurePreviewServer({ plugin: cloudflareRoutes(), outDir: root });

      expect(serve({ middleware, url: '/en' }).statusCode).toBe(CANONICAL_REDIRECT_STATUS);
      expect(serve({ middleware, url: '/code' }).statusCode).toBe(302);
    });

    it('redirects nothing when the build folder is elsewhere', () => {
      const middleware = configurePreviewServer({ plugin: cloudflareRoutes(), outDir: 'build' });

      expect(serve({ middleware, url: '/en' }).isPassed).toBe(true);
      expect(serve({ middleware, url: '/code' }).isPassed).toBe(true);
    });
  });
});
