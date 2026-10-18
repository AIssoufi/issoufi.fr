import { ROUTER_MODULE, TRAILING_SLASHES_PATTERN } from '../constants';

/** Parameters of {@link isAppRouterImport}. */
interface IsAppRouterImportParams {
  /** Module being imported, as written in the import, e.g. `react-router`. */
  source?: string;
  /**
   * Absolute path, with `/` separators, of the module that imports it. Missing for an entry
   * point.
   */
  importer?: string;
  /** Absolute path, with `/` separators, of the folder of the app's code, e.g. `/app/src`. */
  appDir?: string;
}

/**
 * Tells whether a module of the app imports the router, `react-router`, which the standalone
 * build replaces with `vite/standalone/react-router.ts`. Imports from anywhere else keep the real
 * module, such as the one of that replacement module, so it can re-export it.
 *
 * @returns `true` for an import of `react-router` from a file inside `appDir`, `false` otherwise,
 * and when the importer or the folder is missing or empty.
 *
 * @example
 * const appDir = '/app/src';
 * isAppRouterImport({ source: 'react-router', importer: '/app/src/App/App.tsx', appDir }); // true
 * isAppRouterImport({ source: 'react-router', importer: '/app/vite/x.ts', appDir }); // false
 */
export const isAppRouterImport = ({
  source,
  importer,
  appDir,
}: IsAppRouterImportParams = {}): boolean => {
  const isRouterImport = source === ROUTER_MODULE;
  const appDirPath = typeof appDir === 'string' ? appDir.replace(TRAILING_SLASHES_PATTERN, '') : '';
  const canComparePaths = isRouterImport && typeof importer === 'string' && appDirPath !== '';
  if (!canComparePaths) return false;

  return importer.startsWith(`${appDirPath}/`);
};
