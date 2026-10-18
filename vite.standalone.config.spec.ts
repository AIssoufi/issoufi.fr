// @vitest-environment node
import { resolve } from 'node:path';
import { build, normalizePath, type Plugin, type Rollup } from 'vite';

import {
  HASH_ROUTER_MODULE,
  STANDALONE_PAGE_FILE_NAME,
  STANDALONE_README_FILE_NAME,
} from './vite/standalone/constants';
import { listFileNames } from './vite/standalone/utils';

/** Longest time the standalone build may take in this test, coverage included. */
const BUILD_TIMEOUT_MS = 60_000;

/** Module of the app that renders the router. */
const APP_MODULE = normalizePath(resolve('src/App/App.tsx'));

/** A script tag that loads a file, or a link that preloads one. */
const EXTERNAL_SCRIPT_PATTERN = /<script[^>]*\ssrc=|<link[^>]*rel="modulepreload"/;

/**
 * Code of an inline script, up to its closing tag: `vite-plugin-singlefile` escapes any closing tag
 * written in the code, so the first one ends the script.
 */
const INLINE_SCRIPT_CODE_PATTERN = /(<script[^>]*>)[\s\S]*?(<\/script>)/g;

/** HTML of a page without the code of its inline scripts, which may name tags in strings. */
const stripInlineScripts = (html: string) => html.replace(INLINE_SCRIPT_CODE_PATTERN, '$1$2');

/** File of the build: a chunk of scripts or an asset, such as an HTML page. */
type OutputFile = Rollup.OutputChunk | Rollup.OutputAsset;

/** Files of the build, written in memory only. */
let output: OutputFile[] = [];

/** Modules that the module of the app imports, as the build resolved them. */
let appImports: readonly string[] = [];

/** Records the modules that {@link APP_MODULE} imports, once the build has resolved them. */
const recordAppImports = (): Plugin => ({
  name: 'record-app-imports',
  buildEnd() {
    appImports = this.getModuleInfo(APP_MODULE)?.importedIds ?? [];
  },
});

beforeAll(async () => {
  // Vitest sets NODE_ENV to test, which would bundle the development build of React
  vi.stubEnv('NODE_ENV', 'production');
  const result = await build({
    configFile: 'vite.standalone.config.ts',
    logLevel: 'silent',
    plugins: [recordAppImports()],
    build: { write: false },
  });
  output = (Array.isArray(result) ? result[0] : (result as Rollup.RollupOutput)).output;
}, BUILD_TIMEOUT_MS);

afterAll(() => {
  vi.unstubAllEnvs();
});

/** Tells whether a file of the build is an asset, such as an HTML page. */
const isAsset = (file: OutputFile): file is Rollup.OutputAsset => file.type === 'asset';

/** Reads an asset of the build, or an empty string when the build has no such asset. */
const getSource = (fileName: string) =>
  String(output.filter(isAsset).find(file => file.fileName === fileName)?.source ?? '');

describe('standalone build', () => {
  it('has index.html as its only page', () => {
    const pages = output.map(file => file.fileName).filter(fileName => fileName.endsWith('.html'));

    expect(pages).toEqual([STANDALONE_PAGE_FILE_NAME]);
  });

  it('inlines the whole app in the page, so it loads no script from a file', () => {
    const html = getSource(STANDALONE_PAGE_FILE_NAME);

    expect(
      output.map(file => file.fileName).filter(fileName => /\.(js|css)$/.test(fileName)),
    ).toEqual([]);
    expect(html).toMatch(/<script type="module"[^>]*>\S/);
    expect(stripInlineScripts(html)).not.toMatch(EXTERNAL_SCRIPT_PATTERN);
  });

  it('fills the metadata of the home page', () => {
    const html = getSource(STANDALONE_PAGE_FILE_NAME);

    expect(html).not.toContain('%PAGE_');
    expect(html).toMatch(/<title>[^<]+<\/title>/);
  });

  it('routes the app on the hash of the URL', () => {
    const hashRouterModule = normalizePath(resolve(HASH_ROUTER_MODULE));

    expect(appImports).toContain(hashRouterModule);
  });

  it('refers to the files of public/ with URLs relative to the page', () => {
    const html = getSource(STANDALONE_PAGE_FILE_NAME);
    const fileNames = listFileNames(resolve('public'));
    const absoluteUrls = fileNames.filter(name => html.includes(`"/${name}"`));

    expect(fileNames.length).toBeGreaterThan(0);
    expect(absoluteUrls).toEqual([]);
    ['home.webp', 'projects.webp', 'experiences.webp', 'favicon.ico'].forEach(name => {
      expect(html).toContain(`"./${name}"`);
    });
  });

  it('tells how to open it in a README.txt', () => {
    expect(getSource(STANDALONE_README_FILE_NAME)).toContain('index.html');
  });
});
