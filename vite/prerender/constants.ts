/**
 * Module of the app that renders a page to HTML, `prerenderPage`, as the module runner of Vite
 * imports it, from the root of the project.
 */
export const PRERENDER_MODULE = '/src/prerender.tsx';

/** Name of the Vite environment that runs {@link PRERENDER_MODULE} in Node.js during the build. */
export const PRERENDER_ENVIRONMENT_NAME = 'prerender';

/**
 * Module that the thread of the render runs (see `prerenderPagesInWorker`), which Node.js loads as
 * it is, TypeScript included.
 */
export const PRERENDER_WORKER_URL = new URL('./worker.ts', import.meta.url);

/**
 * Modules of the app whose styled components get an id that derives from their path: its
 * TypeScript files, outside of the libraries (`NODE_MODULES_PATTERN`).
 */
export const APP_MODULE_PATTERN = /\.tsx?$/;

/** Module that the app imports `styled` from, to define its styled components. */
export const STYLED_MODULE = '@xstyled/styled-components';

/** Name of the export of `styled` by {@link STYLED_MODULE}, besides its default export. */
export const STYLED_EXPORT_NAME = 'styled';

/**
 * Methods of the factory of a styled component that return another factory, which a tagged
 * template may follow, as in ``styled.a.attrs({ … })`…` ``.
 */
export const FACTORY_METHODS: ReadonlySet<string> = new Set(['attrs', 'withConfig']);

/** Start of the id of a styled component, as styled-components starts its own ids. */
export const COMPONENT_ID_PREFIX = 'sc-';

/**
 * Number of hexadecimal characters of the hash in the id of a styled component: 8, over four
 * billion ids, for about a hundred and fifty components.
 */
export const COMPONENT_ID_HASH_LENGTH = 8;
