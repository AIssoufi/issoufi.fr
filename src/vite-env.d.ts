/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

/**
 * Version of the site, read from `package.json` at build time and written into the code by Vite
 * (`define` in `vite.config.ts`). release-please raises it with each release.
 */
declare const __APP_VERSION__: string;

/**
 * Month in which the site was built, written into the code by Vite (`define` in
 * `vite.config.ts`): the today of the pages that the build renders, which the browser keeps while
 * it hydrates them. Its month is zero-based, as in `Date`: `9` is October.
 */
declare const __BUILD_MONTH__: { year: number; monthIndex: number };
