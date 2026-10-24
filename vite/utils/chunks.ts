import {
  FALLBACK_CHUNK_NAME,
  INDEX_CHUNK_NAME,
  PAGE_ENTRY_FILE,
  PAGES_DIR,
  PATH_SEPARATOR_PATTERN,
} from '../constants.ts';
import type { BuildBundle, BundleFile } from '../types.ts';

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
