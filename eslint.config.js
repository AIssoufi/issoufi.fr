import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { WEBKIT_SPECS } from './e2e/webkit-specs.js';

/**
 * A relative module specifier that names no extension of a module or an asset, such as `./utils`
 * or `./Name.styled`. Add an extension to the list before importing a new kind of file. The `/`
 * is written `\x2F`, since a `/` ends the regular expression of a selector.
 */
const SPECIFIER_WITHOUT_EXTENSION = String.raw`/^\.{1,2}(\x2F[^?]*)?(?<!\.([cm]?[jt]sx?|json|svg|webp|png|jpe?g|avif|css|woff2))(\?.*)?$/`;

/**
 * Relative imports, exports and module mocks name the file that they load: Node.js loads the Vite
 * configs and the modules that they import as they are (`--configLoader native`), and resolves no
 * `./utils` to `./utils.ts` or `./utils/index.ts`.
 */
const EXTENSION_RESTRICTIONS = [
  `:matches(ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration, ImportExpression)[source.value=${SPECIFIER_WITHOUT_EXTENSION}]`,
  `CallExpression[callee.object.name='vi'][callee.property.name=/^(mock|doMock|unmock|doUnmock|importActual|importMock)$/][arguments.0.value=${SPECIFIER_WITHOUT_EXTENSION}]`,
].map(selector => ({
  selector,
  message:
    'Name the file of a relative import, with its extension (./utils.ts, ./List/index.ts): Node.js loads the Vite configs as they are, and resolves no other path.',
}));

/** The widest comment line, in characters: the `printWidth` of `.prettierrc`. */
const COMMENT_MAX_LENGTH = 100;

export default defineConfig([
  globalIgnores([
    'dist',
    'dist-standalone',
    'coverage',
    'test-results',
    'playwright-report',
    'visual-report',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Tests, CI scripts and configuration files
    files: ['**/*.{js,jsx,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'styled-components',
              message:
                'Import styled, css, keyframes, th and the other styled-components APIs from @xstyled/styled-components.',
            },
          ],
          patterns: [
            {
              // A component's style file (Name.styled.ts), anywhere but in the importing folder.
              // Shared style modules (timeline.styled) at the root of a parent stay allowed.
              regex: String.raw`^(?!\./[^/]*$)(.*/)?[A-Z][^/]*\.styled\.ts$`,
              caseSensitive: true,
              message:
                'Only a component imports its own styles: move what several components share to the root of their parent, or to src/components/ when pages share it.',
            },
          ],
        },
      ],
      'no-restricted-syntax': ['error', ...EXTENSION_RESTRICTIONS],
      // Prettier wraps the code at its printWidth, but never a comment. The core rule, deprecated
      // for ESLint Stylistic, still works until ESLint 11; `code` leaves the code to Prettier.
      'max-len': [
        'error',
        { code: Number.MAX_SAFE_INTEGER, comments: COMMENT_MAX_LENGTH, ignoreUrls: true },
      ],
    },
  },
  {
    // The global style removes the bullets of every ul, and Safari then exposes it as a list only
    // with role="list", which List sets. A link that opens a new tab says so to screen readers
    // only as a NewTabLink, which sets the one target="_blank" of the site. This block replaces
    // the restrictions above, so it repeats them
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/List/List.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...EXTENSION_RESTRICTIONS,
        ...[
          "MemberExpression[object.name='styled'][property.name='ul']",
          "CallExpression[callee.name='styled'][arguments.0.value='ul']",
          "JSXOpeningElement[name.name='ul']",
        ].map(selector => ({
          selector,
          message:
            'Render lists with List (src/components/List), or extend it with styled(List): Safari only exposes a ul without bullets as a list with role="list", which List sets.',
        })),
        // target="_blank", or target={'_blank'}
        ...[
          "JSXAttribute[name.name='target'][value.value='_blank']",
          "JSXAttribute[name.name='target'] > JSXExpressionContainer > Literal[value='_blank']",
        ].map(selector => ({
          selector,
          message:
            'Render links to a new tab with NewTabLink (src/components/NewTabLink), or extend it with styled(NewTabLink): it tells screen readers that the link opens a new tab, and gives that tab no access to the site.',
        })),
      ],
    },
  },
  {
    // WebKit loses a navigation now and then, which a bare goto waits on until the test times out.
    // Any object counts, since a test may name its page otherwise. This block replaces the
    // restrictions above, so it repeats them
    files: WEBKIT_SPECS,
    rules: {
      'no-restricted-syntax': [
        'error',
        ...EXTENSION_RESTRICTIONS,
        {
          selector: "MemberExpression[property.name='goto']",
          message:
            'Open a page with gotoRoute (e2e/navigation.ts): a spec of the webkit project needs it to survive the navigations that WebKit loses, which a bare page.goto waits on until it times out.',
        },
      ],
    },
  },
  {
    // Augments the theme types of styled-components, which needs the module itself
    files: ['src/theme/styled.d.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);
