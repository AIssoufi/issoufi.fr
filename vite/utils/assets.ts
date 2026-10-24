import type { BuildBundle, BundleFile } from '../types.ts';

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
