import { parentPort, workerData } from 'node:worker_threads';

import svgr from 'vite-plugin-svgr';

import { minifyStyledCss, styledComponentIds } from './plugins.ts';
import { prerenderPages, type PrerenderWorkerData } from './utils/render.ts';

// The thread that `prerenderPagesInWorker` starts: renders the pages with the plugins of the build
// that the modules of the app need, then sends them back
const { root, define, paths }: PrerenderWorkerData = workerData;
const pages = await prerenderPages({
  root,
  define,
  paths,
  plugins: [svgr(), styledComponentIds(), minifyStyledCss()],
});
parentPort?.postMessage(pages);
