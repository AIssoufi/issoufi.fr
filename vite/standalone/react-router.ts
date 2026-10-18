/**
 * Stands in for `react-router` in the app's code of the standalone build
 * (`vite.standalone.config.ts`): the same exports, except that `BrowserRouter` is the
 * `HashRouter`, which reads the route from the hash of the URL (`index.html#/projects`). Opened
 * from the disk, the path of the URL is the path of the file, which matches no route, so every
 * page would show the not found page.
 */
export * from 'react-router';
export { HashRouter as BrowserRouter } from 'react-router';
