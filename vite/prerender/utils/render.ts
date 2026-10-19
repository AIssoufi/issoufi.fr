import { Worker } from 'node:worker_threads';

import { createRunnableDevEnvironment, type PluginOption, resolveConfig } from 'vite';

import type { PrerenderedPage, PrerenderPage } from '../../../src/utils/prerender.ts';
import {
  PRERENDER_ENVIRONMENT_NAME,
  PRERENDER_MODULE,
  PRERENDER_WORKER_URL,
} from '../constants.ts';

/** Module that renders a page of the app, as `src/prerender.tsx` exports it. */
interface PrerenderModule {
  /** Renders the app at the path of a page. */
  prerenderPage: PrerenderPage;
}

/** Parameters of {@link prerenderPages}. */
interface PrerenderPagesParams {
  /** Root of the project, whose modules the paths of `module` and of the imports start from. */
  root?: string;
  /** Module that exports `prerenderPage`, from the root. @default PRERENDER_MODULE */
  module?: string;
  /**
   * Plugins that transform the modules of the app as the build does, such as its SVG components;
   * the environment transforms TypeScript, JSX and JSON by itself.
   */
  plugins?: PluginOption[];
  /** Constants that the build writes into the code, by name, as the `define` of its config. */
  define?: Record<string, string>;
  /** Paths of the pages to render, such as `/en/projects`. A path given twice renders once. */
  paths?: string[];
}

/**
 * Renders pages of the app to HTML at build time: starts a Vite environment that runs the modules
 * of the app in Node.js, as for a server render, with the packages of `node_modules` loaded by
 * Node.js itself, imports the module that renders a page, renders each path one after another,
 * then closes the environment, even after an error. Starts nothing without a path.
 *
 * @returns The page rendered at each path, by path, and an empty map without a path.
 * @throws The error of a module that fails to load or of a page that fails to render.
 *
 * @example
 * const pages = await prerenderPages({ root, plugins: [svgr()], paths: ['/', '/en/'] });
 * pages.get('/en/')?.html; // '<a href="#content">Skip to content</a>…'
 */
export async function prerenderPages({
  root,
  module = PRERENDER_MODULE,
  plugins = [],
  define = {},
  paths = [],
}: PrerenderPagesParams = {}): Promise<Map<string, PrerenderedPage>> {
  const pages = new Map<string, PrerenderedPage>();
  if (paths.length === 0) return pages;

  const config = await resolveConfig(
    {
      configFile: false,
      envDir: false,
      root,
      // The production JSX runtime, the one of the React of Node.js in the build
      mode: 'production',
      logLevel: 'warn',
      plugins,
      define,
      environments: {
        [PRERENDER_ENVIRONMENT_NAME]: {
          consumer: 'server',
          dev: { moduleRunnerTransform: true },
          resolve: { external: true, mainFields: [], conditions: ['node'] },
        },
      },
    },
    'serve',
  );
  const environment = createRunnableDevEnvironment(PRERENDER_ENVIRONMENT_NAME, config, {
    hot: false,
  });
  await environment.init();

  try {
    const { prerenderPage } = await environment.runner.import<PrerenderModule>(module);
    // One page after another: the app shares the language of i18next between its renders
    for (const path of new Set(paths)) pages.set(path, await prerenderPage(path));
    return pages;
  } finally {
    await environment.close();
  }
}

/** Data that the thread of the render receives (see {@link prerenderPagesInWorker}). */
export interface PrerenderWorkerData {
  /** Root of the project, whose modules the paths of the imports start from. */
  root?: string;
  /** Constants that the build writes into the code, by name, as the `define` of its config. */
  define?: Record<string, string>;
  /** Paths of the pages to render, such as `/en/projects`. A path given twice renders once. */
  paths?: string[];
}

/** Parameters of {@link prerenderPagesInWorker}. */
interface PrerenderPagesInWorkerParams extends PrerenderWorkerData {
  /**
   * Module that the thread runs, which sends the pages back once.
   * @default PRERENDER_WORKER_URL
   */
  worker?: URL | string;
}

/**
 * Renders pages of the app to HTML (see {@link prerenderPages}) in a thread of its own, with the
 * plugins that its modules need (`vite/prerender/worker.ts`). The thread loads React, i18next and
 * styled-components in production apart from the build, which keeps none of their state, and from
 * the tests that build the site, whose own React runs in development and whose coverage would count
 * the modules of the app twice. Ends the thread once it has sent the pages.
 *
 * @returns The page rendered at each path, by path.
 * @throws The error of the thread, or an error when it stops before sending the pages.
 *
 * @example
 * const pages = await prerenderPagesInWorker({ root, define, paths: ['/', '/en/'] });
 */
export function prerenderPagesInWorker({
  worker = PRERENDER_WORKER_URL,
  ...workerData
}: PrerenderPagesInWorkerParams = {}): Promise<Map<string, PrerenderedPage>> {
  return new Promise((resolve, reject) => {
    const thread = new Worker(worker, { workerData });
    thread.once('message', (pages: Map<string, PrerenderedPage>) => {
      resolve(pages);
      void thread.terminate();
    });
    thread.once('error', reject);
    // After the pages or an error, the promise is settled already, and stays so
    thread.once('exit', exitCode =>
      reject(new Error(`The thread of the prerender stopped with code ${exitCode}, with no pages`)),
    );
  });
}
