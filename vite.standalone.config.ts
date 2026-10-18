import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, mergeConfig, normalizePath, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import productionConfig from './vite.config';
import {
  APP_DIR,
  HASH_ROUTER_MODULE,
  STANDALONE_OUT_DIR,
  STANDALONE_README_FILE_NAME,
  STANDALONE_README_SOURCE,
} from './vite/standalone/constants';
import {
  isAppRouterImport,
  isServerOnlyPage,
  listFileNames,
  toRelativePublicUrls,
} from './vite/standalone/utils';

/**
 * Vite plugin that routes the app on the hash of the URL (`index.html#/projects`): the imports of
 * `react-router` from `src/` resolve to `vite/standalone/react-router.ts`, whose `BrowserRouter`
 * is the `HashRouter`. It runs before Vite's own resolver (`enforce: 'pre'`).
 */
const hashRouter = (): Plugin => {
  let appDir = '';
  let hashRouterModule = '';

  return {
    name: 'standalone-hash-router',
    enforce: 'pre',
    configResolved: config => {
      appDir = normalizePath(resolve(config.root, APP_DIR));
      hashRouterModule = normalizePath(resolve(config.root, HASH_ROUTER_MODULE));
    },
    resolveId: (source, importer) =>
      isAppRouterImport({ source, importer, appDir }) ? hashRouterModule : null,
  };
};

/**
 * Vite plugin that makes the URLs of the files of `public/` written in the app's code relative to
 * the page (`'/home.webp'` becomes `'./home.webp'`), since the build copies them next to
 * `index.html` and an absolute URL points to the root of the disk (see
 * {@link toRelativePublicUrls}).
 */
const relativePublicUrls = (): Plugin => {
  let appDir = '';
  let fileNames: string[] = [];

  return {
    name: 'standalone-relative-public-urls',
    configResolved: config => {
      appDir = normalizePath(resolve(config.root, APP_DIR));
      fileNames = listFileNames(config.publicDir);
    },
    transform: (code, id) => {
      const isAppModule = id.startsWith(`${appDir}/`);
      return isAppModule ? toRelativePublicUrls({ code, fileNames }) : null;
    },
  };
};

/**
 * Vite plugin that leaves `index.html` as the only page of the build, removing the pages that
 * only a web server needs (`projects.html`, `404.html`…, see {@link isServerOnlyPage}), and adds
 * the `README.txt` that tells a visitor how to open it. It runs after the `page-meta` plugin of
 * `vite.config.ts`, which emits those pages, and before `vite-plugin-singlefile`, which would
 * inline the app in each of them.
 */
const standalonePage = (): Plugin => {
  let readmeSource = '';

  return {
    name: 'standalone-page',
    enforce: 'post',
    configResolved: config => {
      readmeSource = resolve(config.root, STANDALONE_README_SOURCE);
    },
    generateBundle(_options, bundle) {
      Object.keys(bundle)
        .filter(isServerOnlyPage)
        .forEach(fileName => delete bundle[fileName]);
      this.emitFile({
        type: 'asset',
        fileName: STANDALONE_README_FILE_NAME,
        source: readFileSync(readmeSource),
      });
    },
  };
};

/**
 * Configuration of the standalone build, `pnpm build:standalone`: the production build of
 * `vite.config.ts`, unchanged, plus the plugins that let a visitor open it from the disk with a
 * double click on `index.html`, without a server. The app, its pages loaded lazily included, is
 * inlined in `index.html` (`vite-plugin-singlefile`), since browsers refuse to load module scripts
 * from `file://`; the routes read the hash of the URL; the files of `public/` sit next to it, with
 * relative URLs. The release workflow attaches it to each GitHub release.
 */
export default defineConfig(env =>
  mergeConfig(productionConfig(env), {
    plugins: [hashRouter(), relativePublicUrls(), standalonePage(), viteSingleFile()],
    build: { outDir: STANDALONE_OUT_DIR },
  }),
);
