import { relative } from 'node:path';

import { normalizePath, type Plugin } from 'vite';

import { NODE_MODULES_PATTERN } from '../constants.ts';
import { APP_MODULE_PATTERN, STYLED_MODULE } from './constants.ts';
import { addComponentIds } from './utils/componentIds.ts';
import { minifyCssTemplates } from './utils/cssTemplates.ts';

/**
 * Vite plugin that gives each styled component of the app an id that derives from the path of its
 * module and from its place in it (see {@link addComponentIds}), rather than from the order in
 * which styled-components creates them. The pages that the build renders in Node.js then use the
 * same classes as the browser that hydrates them. It runs on the TypeScript of the app, before the
 * other transforms (`enforce: 'pre'`), with the paths from the root of the project.
 */
export const styledComponentIds = (): Plugin => {
  let root = '';

  return {
    name: 'styled-component-ids',
    enforce: 'pre',
    configResolved: config => {
      root = config.root;
    },
    transform: {
      filter: {
        id: { include: APP_MODULE_PATTERN, exclude: NODE_MODULES_PATTERN },
        code: STYLED_MODULE,
      },
      handler: (code, id) =>
        addComponentIds({ code, modulePath: normalizePath(relative(root, id)) }),
    },
  };
};

/**
 * Vite plugin that minifies the CSS templates of the app (see {@link minifyCssTemplates}), whose
 * comments and indentation would otherwise reach the browser in the JavaScript. The classes of
 * styled-components derive from the text of each template: the build of the app and the render
 * of its pages in Node.js both run it, so that the browser computes the classes of the HTML it
 * hydrates. It runs on the TypeScript of the app, before the other transforms (`enforce: 'pre'`).
 */
export const minifyStyledCss = (): Plugin => ({
  name: 'minify-styled-css',
  enforce: 'pre',
  transform: {
    filter: {
      id: { include: APP_MODULE_PATTERN, exclude: NODE_MODULES_PATTERN },
      code: STYLED_MODULE,
    },
    handler: (code, id) => minifyCssTemplates({ code, modulePath: id }),
  },
});
