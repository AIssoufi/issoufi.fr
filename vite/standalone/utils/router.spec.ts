// @vitest-environment node
import { ROUTER_MODULE } from '../constants.ts';
import { isAppRouterImport } from './router.ts';

const APP_DIR = '/app/src';

describe('isAppRouterImport', () => {
  it.each([
    '/app/src/App/App.tsx',
    '/app/src/App/Header/NavMenu/NavMenu.tsx',
    '/app/src/index.tsx',
  ])('is true for an import of react-router from the app file %s', importer => {
    expect(isAppRouterImport({ source: ROUTER_MODULE, importer, appDir: APP_DIR })).toBe(true);
  });

  it('ignores a trailing slash of the app folder', () => {
    expect(
      isAppRouterImport({
        source: ROUTER_MODULE,
        importer: '/app/src/App/App.tsx',
        appDir: '/app/src/',
      }),
    ).toBe(true);
  });

  it.each([
    '/app/vite/standalone/react-router.ts',
    '/app/node_modules/react-i18next/dist/index.js',
    '/app/vite.config.ts',
    // Shares the beginning of the path of the app folder, but is another folder
    '/app/src-other/App.tsx',
    '/app/src',
  ])('is false for an import of react-router from %s, outside the app', importer => {
    expect(isAppRouterImport({ source: ROUTER_MODULE, importer, appDir: APP_DIR })).toBe(false);
  });

  it.each(['react', 'react-router-dom', 'react-router/dom', './react-router'])(
    'is false for an import of %s from the app',
    source => {
      expect(isAppRouterImport({ source, importer: '/app/src/App/App.tsx', appDir: APP_DIR })).toBe(
        false,
      );
    },
  );

  describe('edge cases', () => {
    it('is false without parameters', () => {
      expect(isAppRouterImport()).toBe(false);
      expect(isAppRouterImport({})).toBe(false);
    });

    it('is false for an entry point, which has no importer', () => {
      expect(isAppRouterImport({ source: ROUTER_MODULE, appDir: APP_DIR })).toBe(false);
    });

    it.each([undefined, '', '/', '///'])('is false for the app folder %j', appDir => {
      expect(
        isAppRouterImport({ source: ROUTER_MODULE, importer: '/app/src/App/App.tsx', appDir }),
      ).toBe(false);
    });

    it.each([42, null, ['/app/src']])('is false for the invalid app folder %j', appDir => {
      expect(
        isAppRouterImport({
          source: ROUTER_MODULE,
          importer: '/app/src/App/App.tsx',
          appDir: appDir as unknown as string,
        }),
      ).toBe(false);
    });

    it.each([42, null, {}])('is false for the invalid importer %j', importer => {
      expect(
        isAppRouterImport({
          source: ROUTER_MODULE,
          importer: importer as unknown as string,
          appDir: APP_DIR,
        }),
      ).toBe(false);
    });
  });
});
