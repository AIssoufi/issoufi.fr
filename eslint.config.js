import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'dist-standalone', 'coverage', 'test-results', 'playwright-report']),
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
              // A component's style file (Name.styled), anywhere but in the importing folder.
              // Shared style modules (timeline.styled) at the root of a parent stay allowed.
              regex: String.raw`^(?!\./[^/]*$)(.*/)?[A-Z][^/]*\.styled$`,
              caseSensitive: true,
              message:
                'Only a component imports its own styles: move what several components share to the root of their parent, or to src/components/ when pages share it.',
            },
          ],
        },
      ],
    },
  },
  {
    // The global style removes the bullets of every ul, and Safari then exposes it as a list only
    // with role="list", which List sets. A link that opens a new tab says so to screen readers
    // only as a NewTabLink, which sets the one target="_blank" of the site
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/List/List.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
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
    // Augments the theme types of styled-components, which needs the module itself
    files: ['src/theme/styled.d.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);
