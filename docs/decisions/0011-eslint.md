# 0011. Lint the code with ESLint

- Date: 2026-10-17
- Status: Accepted

## Context

Create React App ran its own ESLint config during the build until [0003](0003-vite-and-vitest.md). Vite runs no linter, so from 2026-03-21 nothing checked the rules of React hooks, unused code or a forbidden import: the type-check and the tests were the only checks of the code.

## Decision

In [#32](https://github.com/AIssoufi/issoufi.fr/pull/32), merged on 2026-10-17, the third step of the CI of that day ([#30](https://github.com/AIssoufi/issoufi.fr/pull/30) to [#34](https://github.com/AIssoufi/issoufi.fr/pull/34)):

- `eslint.config.js`, ESLint 10 with a flat config: the recommended rules of ESLint and typescript-eslint, React Hooks 7 (with the rules of the React Compiler) and React Refresh for the app; the browser, Node.js and Vitest globals for the tests, scripts and configs.
- `no-restricted-imports` refuses a direct import of `styled-components` ([0010](0010-xstyled-design-tokens.md)), in the editor as well as in the test that already checked it.
- lint-staged runs `eslint --fix` on the staged scripts, then Prettier, before each commit, and a `lint` job of the CI blocks the build.

## Alternatives considered

- **`eslint-plugin-jsx-a11y`**, the usual rules of accessibility in JSX: left out, since it did not support ESLint 10 yet (#32).
- **Biome or oxlint**, one tool for the format and the lint: the pull request records no comparison. ESLint runs the plugins of React Hooks and React Refresh, which the rules above need.

## Consequences

Read on 2026-10-20 from the description of #32 and with `gh api 'repos/AIssoufi/issoufi.fr/actions/runs/<run>/jobs'`.

| Figure                          | Before | After                                                                      |
| ------------------------------- | ------ | -------------------------------------------------------------------------- |
| Linter on the code              | none   | ESLint 10, in the editor, the hook and the CI                              |
| Problems found on the first run |        | 7, fixed in #32                                                            |
| `lint` job of the CI            |        | 16 s on 2026-10-17 (run 39069889731), 23 s on 2026-10-19 (run 39297956504) |

- The first run found two `any` refs in `BurgerMenu`, an unused import in a spec, and disable comments that named an old rule.
- The config became the place for the rules of the project that a test would check too late: ESLint refuses `<ul>`, `target="_blank"` outside `NewTabLink`, and a `Name.styled.ts` imported by another component ([Conventions](../conventions.md)).
