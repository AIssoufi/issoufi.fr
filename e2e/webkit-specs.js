/**
 * Specs of the `webkit` project of `playwright.config.ts`, as globs that its `testMatch` and the
 * `files` of `eslint.config.js` both read: a spec added here gets the ESLint rule that refuses a
 * bare `page.goto`. A JavaScript file with no import, since ESLint loads it through Node.js as it
 * is, and an editor may run ESLint on a Node.js that cannot strip types.
 */
export const WEBKIT_SPECS = [
  '**/axe.e2e.ts',
  '**/font-cache.e2e.ts',
  '**/horizontal-overflow.e2e.ts',
  '**/mobile-menu.e2e.ts',
  '**/no-script-navigation.e2e.ts',
  '**/redirects.e2e.ts',
  '**/touch-targets.e2e.ts',
];
