// @ts-check
import { createServer } from 'vite';

/**
 * Modules to load, by group then by name: the path of each one, relative to the project root,
 * e.g. `{ sources: { theme: '/src/theme/theme.ts' } }`.
 * @typedef {Record<string, Record<string, string>>} ModuleIds
 */

/**
 * Exports of the modules loaded by {@link loadSiteModules}, by group then by name.
 * @typedef {Record<string, Record<string, Record<string, any>>>} SiteModules
 */

/**
 * Loads modules of the site, TypeScript or JSON, compiled by Vite as for the app, so that a
 * script reads the texts, the data and the design tokens of the site itself. Vite runs without
 * the config of the project, its plugins included, and stops once every module is loaded, or
 * one fails.
 * @param {ModuleIds} ids - Modules to load, by group then by name.
 * @returns {Promise<SiteModules>} The exports of each module, in the groups and under the names
 * of `ids`.
 * @throws {Error} When a module is missing or does not compile.
 * @example
 * const { sources } = await loadSiteModules({ sources: { theme: '/src/theme/theme.ts' } });
 * sources.theme.theme.colors.accent; // '#…'
 */
export const loadSiteModules = async ids => {
  const server = await createServer({
    configFile: false,
    logLevel: 'error',
    appType: 'custom',
    // Nothing is served to a browser, so there are no dependencies to prebundle
    optimizeDeps: { noDiscovery: true, entries: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
  });

  /**
   * Loads each module of a group.
   * @param {Record<string, string>} groupIds - Path of each module, by name.
   * @returns {Promise<Record<string, Record<string, any>>>} The exports of each module, by name.
   */
  const loadGroup = async groupIds => {
    const modules = await Promise.all(
      Object.entries(groupIds).map(async ([name, id]) => [name, await server.ssrLoadModule(id)]),
    );
    return Object.fromEntries(modules);
  };

  try {
    const groups = await Promise.all(
      Object.entries(ids).map(async ([group, groupIds]) => [group, await loadGroup(groupIds)]),
    );
    return Object.fromEntries(groups);
  } finally {
    await server.close();
  }
};
