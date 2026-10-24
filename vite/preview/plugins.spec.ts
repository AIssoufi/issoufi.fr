// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Connect, PreviewServer } from 'vite';

import { HASHED_ASSET_MAX_AGE_SECONDS } from '../constants.ts';
import type { HeaderRule } from '../types.ts';
import {
  CACHE_HEADERS_PLUGIN_NAME,
  NOT_FOUND_PAGE_MEDIA_TYPE,
  NOT_FOUND_PAGES_PLUGIN_NAME,
} from './constants.ts';
import {
  cacheHeaders,
  createCacheHeadersMiddleware,
  createNotFoundMiddleware,
  notFoundPages,
} from './plugins.ts';

/** Folder of the build in the fake project, as `build.outDir` names it. */
const OUT_DIR = 'dist';

/** Contents of the files of the fake build, by their path from its root. */
const BUILD_FILES: Record<string, string> = {
  'index.html': '<title>Accueil</title>',
  'projects.html': '<title>Projets</title>',
  '404.html': '<title>Page introuvable</title>',
  'en/index.html': '<title>Home</title>',
  'en/404.html': '<title>Page not found</title>',
  'assets/index-a1b2.js': 'console.log(1);',
};

const HEADERS: OutgoingHttpHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'",
};

/** Parameters of {@link serve}. */
interface ServeParams {
  /** The middleware under test. */
  middleware: Connect.NextHandleFunction;
  /** URL of the request, as Node.js gives it. */
  url?: unknown;
  /** Method of the request. */
  method?: string;
}

/** Runs a middleware on a fake request, and reads what it answered. */
const serve = ({ middleware, url, method = 'GET' }: ServeParams) => {
  const headers = new Map<string, unknown>();
  const answer = { statusCode: 200, headers, body: undefined as unknown, isPassed: false };
  const response = {
    get statusCode() {
      return answer.statusCode;
    },
    set statusCode(statusCode: number) {
      answer.statusCode = statusCode;
    },
    setHeader: (name: string, value: unknown) => headers.set(name, value),
    end: (body: unknown) => {
      answer.body = body;
    },
  };
  middleware({ url, method } as IncomingMessage, response as unknown as ServerResponse, () => {
    answer.isPassed = true;
  });
  return answer;
};

describe('with a build', () => {
  let projectDir = '';
  let root = '';

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'preview-plugins-'));
    root = join(projectDir, OUT_DIR);
    Object.entries(BUILD_FILES).forEach(([file, content]) => {
      mkdirSync(join(root, file, '..'), { recursive: true });
      writeFileSync(join(root, file), content);
    });
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

  describe('createNotFoundMiddleware', () => {
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

  describe('createCacheHeadersMiddleware', () => {
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
});
