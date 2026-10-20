// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'vite';

import { PRERENDER_MODULE } from '../constants.ts';
import { prerenderPages, prerenderPagesInWorker } from './render.ts';

/** Time that a test may take to start a Vite environment, in milliseconds. */
const ENVIRONMENT_TIMEOUT_MS = 30_000;

/** Project of the tests, in a temporary folder: modules that render a page as text. */
let root = '';

/** Writes a module of the project of the tests, at its path from the root. */
const writeModule = (modulePath: string, code: string) => {
  const file = join(root, modulePath);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, code);
};

/** Plugin that tells when the environment closes, through the one hook that every one calls. */
const watchClose = () => {
  const onClose = vi.fn();
  const plugin: Plugin = { name: 'watch-close', closeBundle: onClose };
  return { plugin, onClose };
};

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'prerender-pages-'));
  // Counts its renders, and imports a module lazily, as the pages of the app
  writeModule(
    'pages.ts',
    `let renderCount = 0;
export const prerenderPage = async (path: string) => {
  const { describePage } = await import('./lazy.ts');
  renderCount += 1;
  return { html: \`\${renderCount}: \${describePage(path)}\`, styleTags: '<style></style>' };
};`,
  );
  writeModule('lazy.ts', 'export const describePage = (path: string): string => `page ${path}`;');
  writeModule(
    'constant.ts',
    'export const prerenderPage = async () => ({ html: __GREETING__, styleTags: "" });',
  );
  writeModule(
    'failing.ts',
    'export const prerenderPage = async (path: string) => { throw new Error(`No page at ${path}`); };',
  );
  writeModule('broken.ts', 'export const prerenderPage = ;');
  // Threads that stand for the one of the render: they send back what they received, or fail
  writeModule(
    'echo.mjs',
    `import { parentPort, workerData } from 'node:worker_threads';
parentPort.postMessage(new Map([['/', { html: JSON.stringify(workerData), styleTags: '' }]]));`,
  );
  writeModule('throwing.mjs', "throw new Error('No React');");
  writeModule('exiting.mjs', 'process.exit(3);');
  writeModule('silent.mjs', '');
  writeModule(
    PRERENDER_MODULE,
    'export const prerenderPage = async (path: string) => ({ html: `app at ${path}`, styleTags: "" });',
  );
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('prerenderPages', () => {
  it(
    'renders each path with the module, its lazy imports included, one after another',
    async () => {
      const pages = await prerenderPages({ root, module: '/pages.ts', paths: ['/', '/en/'] });

      expect([...pages]).toEqual([
        ['/', { html: '1: page /', styleTags: '<style></style>' }],
        ['/en/', { html: '2: page /en/', styleTags: '<style></style>' }],
      ]);
    },
    ENVIRONMENT_TIMEOUT_MS,
  );

  it(
    'renders a path given twice once',
    async () => {
      const pages = await prerenderPages({ root, module: '/pages.ts', paths: ['/', '/a', '/'] });

      expect([...pages.keys()]).toEqual(['/', '/a']);
      expect(pages.get('/a')?.html).toBe('2: page /a');
    },
    ENVIRONMENT_TIMEOUT_MS,
  );

  it(
    'renders with the module of the app, src/prerender.tsx, by default',
    async () => {
      const pages = await prerenderPages({ root, paths: ['/projects'] });

      expect(pages.get('/projects')?.html).toBe('app at /projects');
    },
    ENVIRONMENT_TIMEOUT_MS,
  );

  it(
    'writes the constants of the build into the code',
    async () => {
      const pages = await prerenderPages({
        root,
        module: '/constant.ts',
        define: { __GREETING__: JSON.stringify('Bonjour') },
        paths: ['/'],
      });

      expect(pages.get('/')?.html).toBe('Bonjour');
    },
    ENVIRONMENT_TIMEOUT_MS,
  );

  it(
    'transforms the modules with the plugins, as the build does, then closes',
    async () => {
      const shout: Plugin = {
        name: 'shout',
        transform: (code, id) => (id.endsWith('/lazy.ts') ? code.replace('page', 'PAGE') : null),
      };
      const { plugin, onClose } = watchClose();

      const pages = await prerenderPages({
        root,
        module: '/pages.ts',
        plugins: [shout, plugin],
        paths: ['/'],
      });

      expect(pages.get('/')?.html).toBe('1: PAGE /');
      expect(onClose).toHaveBeenCalledOnce();
    },
    ENVIRONMENT_TIMEOUT_MS,
  );

  it(
    'throws the error of a page that fails to render, after closing the environment',
    async () => {
      const { plugin, onClose } = watchClose();

      await expect(
        prerenderPages({ root, module: '/failing.ts', plugins: [plugin], paths: ['/en/'] }),
      ).rejects.toThrow('No page at /en/');
      expect(onClose).toHaveBeenCalledOnce();
    },
    ENVIRONMENT_TIMEOUT_MS,
  );

  it(
    'throws the error of a module that fails to load',
    async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(prerenderPages({ root, module: '/broken.ts', paths: ['/'] })).rejects.toThrow();
    },
    ENVIRONMENT_TIMEOUT_MS,
  );

  it.each([
    ['no parameters', undefined],
    ['no paths', { root, module: '/broken.ts' }],
    ['an empty list of paths', { root, module: '/broken.ts', paths: [] }],
  ])('renders nothing, nor loads the module, with %s', async (_, params) => {
    await expect(prerenderPages(params)).resolves.toEqual(new Map());
  });
});

describe('prerenderPagesInWorker', () => {
  /** Reads the URL of a module of the project of the tests. */
  const workerUrl = (fileName: string) => new URL(`file://${join(root, fileName)}`);

  it('sends the root, constants and paths to the thread, and returns the pages that it sends', async () => {
    const workerData = { root: '/site', define: { __A__: '1' }, paths: ['/', '/en/'] };

    const pages = await prerenderPagesInWorker({ worker: workerUrl('echo.mjs'), ...workerData });

    expect(pages).toBeInstanceOf(Map);
    expect(JSON.parse(pages.get('/')?.html ?? '')).toEqual(workerData);
  });

  it('accepts the path of the module of the thread', async () => {
    const pages = await prerenderPagesInWorker({ worker: join(root, 'echo.mjs') });

    expect(pages.get('/')?.html).toBe('{}');
  });

  it('throws the error of the thread', async () => {
    await expect(prerenderPagesInWorker({ worker: workerUrl('throwing.mjs') })).rejects.toThrow(
      'No React',
    );
  });

  it.each([
    ['with an error code', 'exiting.mjs', 3],
    ['without sending the pages', 'silent.mjs', 0],
  ])('throws when the thread stops %s', async (_, fileName, exitCode) => {
    await expect(prerenderPagesInWorker({ worker: workerUrl(fileName) })).rejects.toThrow(
      `The thread of the prerender stopped with code ${exitCode}, with no pages`,
    );
  });

  it(
    'renders the pages of the app, by default, with its plugins',
    async () => {
      const pages = await prerenderPagesInWorker({ root, paths: ['/en/'] });

      expect(pages.get('/en/')?.html).toBe('app at /en/');
    },
    ENVIRONMENT_TIMEOUT_MS,
  );
});
