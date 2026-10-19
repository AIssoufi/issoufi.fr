import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, mergeConfig, normalizePath, type Plugin } from 'vite';

import { FONT_FACES } from './src/theme/constants.ts';
import productionConfig from './vite.config.ts';
import {
  APP_DIR,
  HASH_ROUTER_MODULE,
  STANDALONE_OUT_DIR,
  STANDALONE_PAGE_FILE_NAME,
  STANDALONE_README_FILE_NAME,
  STANDALONE_README_SOURCE,
} from './vite/standalone/constants.ts';
import {
  inlineScript,
  isEntryChunk,
  isServerOnlyFile,
  removePreloadMarkers,
} from './vite/standalone/utils/bundle.ts';
import {
  type EmbeddedFont,
  findMissingFontUrls,
  readFontDataUrl,
  removeFontPreloads,
  toFontDataUrls,
} from './vite/standalone/utils/fonts.ts';
import { listFileNames, toRelativePublicUrls } from './vite/standalone/utils/public-files.ts';
import { removeManifestLinks } from './vite/standalone/utils/manifest.ts';
import { isAppRouterImport } from './vite/standalone/utils/router.ts';

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
 * Vite plugin that embeds the web fonts of the site in the page, so that it renders in them
 * offline, whatever the browser allows from `file://`: in the `<style>` that the `font-faces`
 * plugin of `vite.config.ts` adds to `index.html`, the URL of each font file of `FONT_FACES`
 * (`src/theme/constants.ts`) becomes a data URL (see {@link toFontDataUrls}), and the links that
 * preload them go (see {@link removeFontPreloads}). The build fails when a font file is missing
 * from `public/`.
 */
const embeddedFonts = (): Plugin => {
  let fonts: EmbeddedFont[] = [];

  return {
    name: 'standalone-embedded-fonts',
    configResolved: config => {
      fonts = FONT_FACES.map(({ url }) => ({
        url,
        dataUrl: readFontDataUrl({ publicDir: config.publicDir, url }),
      }));
    },
    buildStart() {
      const missingUrls = findMissingFontUrls(fonts);
      if (missingUrls.length > 0)
        this.error(`Font files missing from public/: ${missingUrls.join(', ')}`);
    },
    // After the hooks without an order, the one of the font-faces plugin included
    transformIndexHtml: {
      order: 'post',
      handler: html => removeFontPreloads(toFontDataUrls({ source: html, fonts })),
    },
  };
};

/**
 * Vite plugin that makes `index.html` the only page of the build, and a page that needs no other
 * file to run. It removes the files that only a web server needs (`projects.html`, `404.html`…,
 * the web app manifests, `_headers`, `sitemap.xml`, see {@link isServerOnlyFile}) and the link of
 * `index.html` to its manifest (see {@link removeManifestLinks}), puts the code of the app in the
 * script tag of `index.html`, since browsers refuse to load module scripts from `file://` (see
 * {@link inlineScript}), without the preload markers of its inlined dynamic imports (see
 * {@link removePreloadMarkers}), and adds the `README.txt` that tells a visitor how to open it. It
 * runs after the `page-meta`, `sitemap`, `web-manifests` and `http-headers` plugins of
 * `vite.config.ts`, which emit those files and that link: the first one also uses
 * `enforce: 'post'`, in the order of the plugins, and the others run before the `post` plugins.
 * The build has a single chunk, its dynamic imports inlined (`codeSplitting: false`).
 */
const standalonePage = (): Plugin => {
  let readmeSource = '';

  return {
    name: 'standalone-page',
    enforce: 'post',
    configResolved: config => {
      readmeSource = resolve(config.root, STANDALONE_README_SOURCE);
    },
    // After the hooks without an order, the one of the page-meta plugin included
    transformIndexHtml: { order: 'post', handler: removeManifestLinks },
    generateBundle(_options, bundle) {
      Object.keys(bundle)
        .filter(isServerOnlyFile)
        .forEach(fileName => delete bundle[fileName]);

      const page = bundle[STANDALONE_PAGE_FILE_NAME];
      const hasPage = page?.type === 'asset';
      if (!hasPage) this.error(`The build has no ${STANDALONE_PAGE_FILE_NAME}`);

      Object.values(bundle)
        .filter(isEntryChunk)
        .forEach(({ fileName, code }) => {
          const html = String(page.source);
          const inlinedHtml = inlineScript({ html, fileName, code: removePreloadMarkers(code) });
          const isInlined = inlinedHtml !== html;
          if (!isInlined) this.error(`${STANDALONE_PAGE_FILE_NAME} loads no ${fileName}`);

          page.source = inlinedHtml;
          delete bundle[fileName];
        });

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
 * `vite.config.ts`, unchanged, plus what lets a visitor open it from the disk with a double click
 * on `index.html`, without a server. The app, its pages loaded lazily included, is one script
 * inlined in `index.html`, its web fonts included; the routes read the hash of the URL; the files
 * of `public/` sit next to it, with URLs relative to the page (`base: './'`). The release workflow
 * attaches it to each GitHub release.
 */
export default defineConfig(env =>
  mergeConfig(productionConfig(env), {
    base: './',
    plugins: [hashRouter(), relativePublicUrls(), embeddedFonts(), standalonePage()],
    build: {
      outDir: STANDALONE_OUT_DIR,
      // Nothing is left to preload once the whole app is in the page
      modulePreload: false,
      rolldownOptions: { output: { codeSplitting: false } },
    },
  }),
);
