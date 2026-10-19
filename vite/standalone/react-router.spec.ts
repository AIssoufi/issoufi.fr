import * as reactRouter from 'react-router';

import * as standaloneRouter from './react-router.ts';

/** Exports of a module, by name. */
type ModuleExports = Record<string, unknown>;

describe('react-router of the standalone build', () => {
  it('exports the HashRouter as BrowserRouter', () => {
    expect(standaloneRouter.BrowserRouter).toBe(reactRouter.HashRouter);
  });

  it('exports the same names as react-router', () => {
    expect(Object.keys(standaloneRouter).sort()).toEqual(Object.keys(reactRouter).sort());
  });

  it('re-exports everything else of react-router as it is', () => {
    const otherNames = Object.keys(reactRouter).filter(name => name !== 'BrowserRouter');

    otherNames.forEach(name => {
      expect((standaloneRouter as ModuleExports)[name]).toBe((reactRouter as ModuleExports)[name]);
    });
  });
});
