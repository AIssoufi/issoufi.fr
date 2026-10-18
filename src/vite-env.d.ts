/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

/**
 * Version of the site, read from `package.json` at build time and written into the code by Vite
 * (`define` in `vite.config.ts`). release-please raises it with each release.
 */
declare const __APP_VERSION__: string;
