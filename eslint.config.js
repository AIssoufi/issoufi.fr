import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'test-results', 'playwright-report']),
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
    // Augments the theme types of styled-components, which needs the module itself
    files: ['src/theme/styled.d.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);
