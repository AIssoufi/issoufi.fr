import { type Dirent, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { PATH_SEPARATOR } from '../../../src/i18n/constants.ts';

/** Parameters of {@link hasEntry}. */
interface HasEntryParams {
  /** Absolute path of the folder to read. */
  folder: string;
  /** Name of the entry, matched with case. */
  name: string;
  /** Whether the entry must be a folder, rather than a file. */
  isFolder: boolean;
}

/** Tells whether a folder holds a file or a folder of that exact name, `false` when it is none. */
const hasEntry = ({ folder, name, isFolder }: HasEntryParams): boolean => {
  const isWantedEntry = (entry: Dirent) => {
    const hasWantedType = isFolder ? entry.isDirectory() : entry.isFile();
    return entry.name === name && hasWantedType;
  };
  try {
    return readdirSync(folder, { withFileTypes: true }).some(isWantedEntry);
  } catch {
    return false;
  }
};

/** Parameters of {@link isExactFile} and {@link findExactFile}. */
interface ExactFileParams {
  /** Absolute path of the root of the build. */
  root: string;
}

/** Parameters of {@link isExactFile}. */
interface IsExactFileParams extends ExactFileParams {
  /** Path of the file from the root, without a leading `/`, e.g. `en/404.html`. */
  file: string;
}

/**
 * Tells whether the build holds a file at that path, case included, as Cloudflare Pages matches
 * it, even on a disk that ignores case, such as that of macOS. The path is read folder by folder,
 * from the names that the disk lists, so `..` and an empty segment name no file.
 *
 * @returns `true` for a file, `false` for a folder, a path that differs in case, a missing path
 * and a missing root.
 *
 * @example
 * isExactFile({ root: '/app/dist', file: 'en/404.html' }); // true
 * isExactFile({ root: '/app/dist', file: 'Projects.html' }); // false
 */
export const isExactFile = ({ root, file }: IsExactFileParams): boolean => {
  const segments = file.split(PATH_SEPARATOR);
  const lastIndex = segments.length - 1;

  return segments.every((name, index) =>
    hasEntry({
      folder: join(root, ...segments.slice(0, index)),
      name,
      isFolder: index < lastIndex,
    }),
  );
};

/** Parameters of {@link findExactFile}. */
interface FindExactFileParams extends ExactFileParams {
  /** Paths of the files from the root, without a leading `/`, in the order to try them. */
  files: readonly string[];
}

/**
 * Finds the first of the files that the build holds, case included (see {@link isExactFile}).
 *
 * @returns Its path from the root, or `undefined` when the build holds none.
 *
 * @example
 * findExactFile({ root: '/app/dist', files: ['en/a/404.html', 'en/404.html'] }); // 'en/404.html'
 */
export const findExactFile = ({ root, files }: FindExactFileParams): string | undefined =>
  files.find(file => isExactFile({ root, file }));
