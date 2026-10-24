import type { HtmlTagDescriptor } from 'vite';

import { FONT_FACES, FONT_MEDIA_TYPE } from '../src/theme/constants.ts';
import type { FontFaceDeclaration } from '../src/theme/types.ts';
import { isDeclarableFontFace, renderFontFaces } from '../src/theme/utils.ts';
import {
  DEFAULT_DEV_PORT,
  DEFAULT_PREVIEW_PORT,
  FALLBACK_CHUNK_NAME,
  HEADER_INDENT,
  HEADER_NAME_PATTERN,
  HEADER_PATH_PATTERN,
  HEADER_RULES,
  INDEX_CHUNK_NAME,
  LINE_BREAK_PATTERN,
  MAX_PORT,
  MIN_PORT,
  PAGE_ENTRY_FILE,
  PAGES_DIR,
  PATH_SEPARATOR_PATTERN,
  PORT_PATTERN,
} from './constants.ts';
import type { HeaderRule } from './types.ts';

/** Environment variables, as Vite's `loadEnv` returns them. */
type Env = Record<string, string | undefined>;

/** Ports of the dev and preview servers. */
interface ServerPorts {
  /** Port of `pnpm dev`. */
  dev: number;
  /** Port of `pnpm preview`, also read by the browser tests of `playwright.config.ts`. */
  preview: number;
}

/**
 * Reads a TCP port from the value of an environment variable.
 *
 * @param value - Raw value of the variable. Surrounding spaces are ignored.
 * @returns The port, or `undefined` when the value is missing, empty, not a whole number written
 * in digits, or outside 1–65535, so the caller falls back to its default port.
 *
 * @example
 * parsePort('12345'); // 12345
 * parsePort('abc'); // undefined
 */
export const parsePort = (value: unknown): number | undefined => {
  if (typeof value !== 'string') return undefined;

  const digits = value.trim();
  const isWrittenInDigits = PORT_PATTERN.test(digits);
  if (!isWrittenInDigits) return undefined;

  const port = Number(digits);
  const isInRange = port >= MIN_PORT && port <= MAX_PORT;
  return isInRange ? port : undefined;
};

/**
 * Picks the ports of the dev and preview servers from the `PORT` variable, which the Worktrunk
 * hook of `.config/wt.toml` writes to the `.env.local` of each worktree. Without a valid `PORT`,
 * as in the main checkout, the dev server uses {@link DEFAULT_DEV_PORT} and the preview server
 * {@link DEFAULT_PREVIEW_PORT}, Vite's default.
 *
 * @param env - Environment variables. Defaults to none.
 * @returns The port of each server.
 *
 * @example
 * getServerPorts({ PORT: '12345' }); // { dev: 12345, preview: 12345 }
 * getServerPorts({}); // { dev: 3000, preview: 4173 }
 */
export const getServerPorts = (env: Env = {}): ServerPorts => {
  const port = parsePort(env?.PORT);
  return { dev: port ?? DEFAULT_DEV_PORT, preview: port ?? DEFAULT_PREVIEW_PORT };
};

/**
 * Chunk of the build, as Rolldown passes it to `output.chunkFileNames`: the fields that name it.
 */
interface ChunkNameInfo {
  /** Name Rolldown gives the chunk: the file name of its main module, without the extension. */
  name?: string;
  /** Path of the main module of the chunk, `null` for a chunk of modules shared by others. */
  facadeModuleId?: string | null;
}

/**
 * Names a chunk of the build after the folder of its main module when that module is an `index`
 * file, so the chunk of a page loaded on its first visit, `src/pages/Projects/index.ts`, reads
 * `Projects` rather than `index` in the build and in the size report of the CI.
 *
 * @param chunk - Chunk to name. Defaults to none.
 * @returns The folder of the `index` module, the name Rolldown gave otherwise, and
 * {@link FALLBACK_CHUNK_NAME} when the chunk has no name.
 *
 * @example
 * getChunkName({ name: 'index', facadeModuleId: '/app/src/pages/Projects/index.ts' });
 * // 'Projects'
 * getChunkName({ name: 'library', facadeModuleId: '/app/node_modules/library/library.js' });
 * // 'library'
 */
export const getChunkName = ({ name, facadeModuleId }: ChunkNameInfo = {}): string => {
  const hasName = typeof name === 'string' && name !== '';
  if (!hasName) return FALLBACK_CHUNK_NAME;

  const isIndexChunk = name === INDEX_CHUNK_NAME && typeof facadeModuleId === 'string';
  if (!isIndexChunk) return name;

  const folders = facadeModuleId.split(PATH_SEPARATOR_PATTERN).slice(0, -1);
  const parentFolder = folders[folders.length - 1];
  return parentFolder || name;
};

/** File of the build, as Rolldown passes it to `generateBundle`: the fields that find a chunk. */
interface BundleFile {
  /** `chunk` for a script, `asset` for any other file. */
  type?: string;
  /** Path of the file in the build, e.g. `assets/Projects-1a2b3c.js`. */
  fileName?: string;
  /** Path of the main module of a chunk, `null` for a chunk of modules shared by others. */
  facadeModuleId?: string | null;
  /** Whether a chunk is an entry of the build, such as the main chunk that the template loads. */
  isEntry?: boolean;
  /** File names of the chunks that a chunk imports statically. */
  imports?: readonly string[];
  /** Paths of the files that an asset was emitted from, such as a font file of `public/`. */
  originalFileNames?: readonly string[];
}

/** Files of the build, by file name, as Rolldown passes them to `generateBundle`. */
type BuildBundle = Record<string, BundleFile | null | undefined>;

/** Parameters of {@link getPageChunkFile} and {@link getPageChunkFiles}. */
interface GetPageChunkFileParams {
  /** Files of the build, by file name, as Rolldown passes them to `generateBundle`. */
  bundle?: BuildBundle;
  /** Folder of the page in `src/pages`, e.g. `Projects`. */
  folder?: string;
}

/**
 * Finds the chunk built from the `index.ts` of a page folder, the chunk that `App.tsx` loads
 * lazily on the first visit of the page.
 *
 * @returns The path of the chunk in the build, or `undefined` when the page has no chunk of its
 * own, as the home page, which is in the main chunk, when the bundle is missing, or when the
 * folder is missing or blank.
 *
 * @example
 * getPageChunkFile({ bundle, folder: 'Projects' }); // 'assets/Projects-1a2b3c.js'
 * getPageChunkFile({ bundle, folder: 'Home' }); // undefined
 */
export const getPageChunkFile = ({ bundle, folder }: GetPageChunkFileParams = {}):
  string | undefined => {
  const hasFolder = typeof folder === 'string' && folder.trim() !== '';
  const hasBundle = typeof bundle === 'object' && bundle !== null;
  const canSearch = hasFolder && hasBundle;
  if (!canSearch) return undefined;

  const pageEntrySuffix = `/${PAGES_DIR}/${folder}/${PAGE_ENTRY_FILE}`;
  const isPageChunk = (file: BundleFile | null | undefined) => {
    const moduleId = file?.facadeModuleId;
    const isChunk = file?.type === 'chunk' && typeof moduleId === 'string';
    if (!isChunk) return false;

    const modulePath = moduleId.split(PATH_SEPARATOR_PATTERN).join('/');
    return modulePath.endsWith(pageEntrySuffix);
  };

  const fileName = Object.values(bundle).find(isPageChunk)?.fileName;
  const hasFileName = typeof fileName === 'string' && fileName !== '';
  return hasFileName ? fileName : undefined;
};

/** Parameters of {@link collectChunks}. */
interface CollectChunksParams {
  /** Files of the build, by file name. */
  bundle: BuildBundle;
  /** File names of the chunks to start from. */
  fileNames: readonly string[];
  /** File names to neither collect nor walk through. Defaults to none. */
  excluded?: readonly string[];
}

/**
 * Collects chunks of the build and every chunk that they import statically, directly or not.
 *
 * @returns The file names of the chunks, each once, in the order met; a file name that is not a
 * chunk of the bundle is skipped.
 */
const collectChunks = ({ bundle, fileNames, excluded = [] }: CollectChunksParams): string[] => {
  const files: string[] = [];
  const addChunk = (fileName: unknown) => {
    const isNewFileName =
      typeof fileName === 'string' && !files.includes(fileName) && !excluded.includes(fileName);
    if (!isNewFileName) return;

    const file = bundle[fileName];
    if (file?.type !== 'chunk') return;

    files.push(fileName);
    if (Array.isArray(file.imports)) file.imports.forEach(addChunk);
  };

  fileNames.forEach(addChunk);
  return files;
};

/**
 * Lists the chunks that a direct visit of a page needs besides the main chunk: the chunk of the
 * page (see {@link getPageChunkFile}), then every chunk that it imports statically, and those
 * that they import in turn. A module that only lazy pages import, such as a helper that two pages
 * share, becomes a chunk of its own, which the browser would request only once the page chunk
 * has run. The entry chunks are left out, with every chunk that they import, directly or not:
 * the template already loads them.
 *
 * @returns The paths of the chunks in the build, the page chunk first, each once; none when the
 * page has no chunk of its own, when an entry chunk is or imports it, since the template loads it
 * already, when the bundle is missing or the folder is missing or blank. An import that is not a
 * chunk of the bundle is skipped.
 *
 * @example
 * getPageChunkFiles({ bundle, folder: 'Projects' });
 * // ['assets/Projects-1a2b3c.js', 'assets/technologies-4d5e6f.js']
 * getPageChunkFiles({ bundle, folder: 'Home' }); // []
 */
export const getPageChunkFiles = ({ bundle, folder }: GetPageChunkFileParams = {}): string[] => {
  const pageChunkFile = getPageChunkFile({ bundle, folder });
  if (!pageChunkFile || !bundle) return [];

  const isEntryChunk = (fileName: string) => {
    const file = bundle[fileName];
    return file?.type === 'chunk' && file.isEntry === true;
  };
  const entryFiles = Object.keys(bundle).filter(isEntryChunk);
  const templateFiles = collectChunks({ bundle, fileNames: entryFiles });
  return collectChunks({ bundle, fileNames: [pageChunkFile], excluded: templateFiles });
};

/** Parameters of {@link getAssetFileName}. */
interface GetAssetFileNameParams {
  /** Files of the build, by file name, as Rolldown passes them to `generateBundle`. */
  bundle?: BuildBundle;
  /** Path of the file that the asset was emitted from, as the plugin gave it to `emitFile`. */
  originalFileName?: string;
}

/**
 * Finds the path in the build of an asset emitted from a file, such as a font file of `public/`
 * that the `font-faces` plugin of `vite.config.ts` copies under a hash of its content.
 *
 * @returns The path of the asset in the build, or `undefined` when no asset of the bundle was
 * emitted from that file, when the bundle is missing, or when the path is missing or blank.
 *
 * @example
 * getAssetFileName({ bundle, originalFileName: '/app/public/fonts/montserrat-latin.woff2' });
 * // 'assets/montserrat-latin-1a2b3c.woff2'
 */
export const getAssetFileName = ({ bundle, originalFileName }: GetAssetFileNameParams = {}):
  string | undefined => {
  const hasOriginalFileName =
    typeof originalFileName === 'string' && originalFileName.trim() !== '';
  const hasBundle = typeof bundle === 'object' && bundle !== null;
  const canSearch = hasOriginalFileName && hasBundle;
  if (!canSearch) return undefined;

  const isEmittedFromFile = (file: BundleFile | null | undefined) => {
    const sources = file?.originalFileNames;
    const isAsset = file?.type === 'asset' && Array.isArray(sources);
    return isAsset && sources.includes(originalFileName);
  };

  const fileName = Object.values(bundle).find(isEmittedFromFile)?.fileName;
  const hasFileName = typeof fileName === 'string' && fileName !== '';
  return hasFileName ? fileName : undefined;
};

/** Keeps the URL of a font file as it is: the default of {@link GetFontFaceTagsParams.getUrl}. */
const keepUrl = (url: string) => url;

/** Parameters of {@link getFontFaceTags}. */
interface GetFontFaceTagsParams {
  /**
   * Fonts to preload and declare. Defaults to {@link FONT_FACES}. Any value that is not an array
   * counts as none, and an entry without a family or a URL is left out.
   */
  fontFaces?: readonly FontFaceDeclaration[];
  /**
   * Gives the URL that the pages load a font file from, from its URL in the site, such as the URL
   * of its copy under a hash of its content in the build. Defaults to the URL itself. A face whose
   * URL it does not turn into a filled string is left out, its preload link with its rule.
   */
  getUrl?: (url: string) => string;
}

/**
 * Lists the tags that the `font-faces` plugin of `vite.config.ts` adds to the head of every page
 * for the web fonts: a link that preloads each font file, since every page shows text in each
 * font, then a `<style>` of their `@font-face` rules (see `renderFontFaces`). The rules sit in a
 * style sheet of their own, which nothing changes: in the style sheet of styled-components, which
 * grows with each component that mounts, Chrome would load the fonts again each time, showing the
 * fallback font meanwhile.
 *
 * @returns The preload links, in the order of the fonts, then the style; none when there is no
 * font to declare.
 *
 * @example
 * getFontFaceTags();
 * // [{ tag: 'link', attrs: { rel: 'preload', href: '/fonts/montserrat-latin.woff2', … } }, …,
 * //  { tag: 'style', children: "@font-face {\n  font-family: 'Montserrat';…", injectTo: 'head' }]
 * getFontFaceTags({ getUrl: url => '/assets/montserrat-latin-1a2b3c.woff2' });
 * // [{ tag: 'link', attrs: { …, href: '/assets/montserrat-latin-1a2b3c.woff2', … } }, …]
 */
export const getFontFaceTags = ({
  fontFaces = FONT_FACES,
  getUrl = keepUrl,
}: GetFontFaceTagsParams = {}): HtmlTagDescriptor[] => {
  const toPageUrl = typeof getUrl === 'function' ? getUrl : keepUrl;
  const declarableFaces = Array.isArray(fontFaces) ? fontFaces.filter(isDeclarableFontFace) : [];
  const faces = declarableFaces
    .map(face => ({ ...face, url: toPageUrl(face.url) }))
    .filter(isDeclarableFontFace);
  if (faces.length === 0) return [];

  const preloadLinks = faces.map(({ url }): HtmlTagDescriptor => ({
    tag: 'link',
    attrs: { rel: 'preload', href: url, as: 'font', type: FONT_MEDIA_TYPE, crossorigin: true },
    injectTo: 'head',
  }));
  const style: HtmlTagDescriptor = {
    tag: 'style',
    children: renderFontFaces({ fontFaces: faces }),
    injectTo: 'head',
  };
  return [...preloadLinks, style];
};

/**
 * Tells whether a header can be written on a line of `_headers`: its name is an HTTP token and
 * its value a string that is not blank and holds no line break.
 */
const isWritableHeader = ([name, value]: [string, unknown]): boolean => {
  const isWritableValue =
    typeof value === 'string' && value.trim() !== '' && !LINE_BREAK_PATTERN.test(value);
  return HEADER_NAME_PATTERN.test(name) && isWritableValue;
};

/**
 * Writes a rule of `_headers`: its path, then each header on a line of its own, indented.
 *
 * @param rule - Rule to write, from a list that may hold anything.
 * @returns The block of the rule, without a trailing line break, or `''` when the rule is not an
 * object, its path is not a path pattern (see `HEADER_PATH_PATTERN`) or it has no header to write.
 */
const renderHeaderRule = (rule: unknown): string => {
  const isObject = typeof rule === 'object' && rule !== null;
  if (!isObject) return '';

  const { path, headers } = rule as Partial<HeaderRule>;
  const hasPath = typeof path === 'string' && HEADER_PATH_PATTERN.test(path);
  const hasHeaders = typeof headers === 'object' && headers !== null && !Array.isArray(headers);
  if (!hasPath || !hasHeaders) return '';

  const lines = Object.entries(headers)
    .filter(isWritableHeader)
    .map(([name, value]) => `${HEADER_INDENT}${name}: ${value.trim()}`);
  return lines.length > 0 ? [path, ...lines].join('\n') : '';
};

/** Parameters of {@link renderHeaderRules}. */
interface RenderHeaderRulesParams {
  /**
   * Rules to write. Defaults to {@link HEADER_RULES}. Any value that is not an array counts as
   * none, and a rule without a path pattern or without a header to write is left out, as is a
   * header whose name is not an HTTP token or whose value is blank or holds a line break.
   */
  rules?: readonly HeaderRule[];
}

/**
 * Writes the `_headers` file that the `http-headers` plugin of `vite.config.ts` adds to the root
 * of the build: the HTTP headers that Cloudflare Pages adds to its responses, by path. Each rule
 * is its path, then each header indented on a line of its own, and a blank line parts the rules.
 *
 * @returns The content of the file, ending with a line break, or `''` when there is no rule to
 * write.
 *
 * @example
 * renderHeaderRules({ rules: [{ path: '/assets/*', headers: { 'Cache-Control': 'immutable' } }] });
 * // '/assets/*\n  Cache-Control: immutable\n'
 */
export const renderHeaderRules = ({
  rules = HEADER_RULES,
}: RenderHeaderRulesParams = {}): string => {
  const blocks = (Array.isArray(rules) ? rules : []).map(renderHeaderRule).filter(Boolean);
  return blocks.length > 0 ? `${blocks.join('\n\n')}\n` : '';
};
