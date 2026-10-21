# 0017. Update TypeScript to 6

- Date: 2026-10-21
- Status: Accepted

## Context

The site type-checks its code with TypeScript ([0001](0001-typescript.md)), declared as `^5.7.0` and installed as 5.9.3. TypeScript 6.0.3 came out on 2026-04-16 and 7.0.2 on 2026-07-08. `typescript-eslint` 8.71.1, which lints the TypeScript files ([0011](0011-eslint.md)), and 8.72.0, its latest release, declare `typescript >=4.8.4 <6.1.0` as their peer dependency.

TypeScript 6.0 deprecates options that 7.0 removes, such as `baseUrl`, `downlevelIteration`, the `node10` and `classic` module resolutions, the `es5` target and `esModuleInterop: false`. `tsc` fails on a deprecated option unless `ignoreDeprecations` silences it.

## Decision

In [#352](https://github.com/AIssoufi/issoufi.fr/pull/352), for [#323](https://github.com/AIssoufi/issoufi.fr/issues/323), `typescript` goes to `^6.0.3`. None of `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` and `scripts/tsconfig.json` sets an option that 6.0 deprecates: `pnpm typecheck` passes on the four of them with no change, and no `ignoreDeprecations`.

## Alternatives considered

- **TypeScript 7**: no release of `typescript-eslint` accepts a version from 6.1.0, so the lint would run against a type checker that it does not support.
- **Staying on 5.9**: it keeps the project one major behind, and leaves the deprecations of 6.0 unchecked until the move to 7.

## Consequences

Measured with Node.js 24.22.0, base and branch in turn, medians of three runs.

| Figure                  | Before (5.9.3) | After (6.0.3) |
| ----------------------- | -------------- | ------------- |
| Clean install           | 1.8 s          | 2.0 s         |
| `pnpm typecheck`        | 3.5 s          | 3.7 s         |
| `pnpm build`            | 3.9 s          | 4.2 s         |
| JavaScript, gzip        | 159,836 B      | 159,836 B     |
| `pnpm audit` advisories | 0              | 0             |

- The code and the tests do not change, and the build output keeps the same bytes: Vite strips the types without `tsc`. Each change of time lies within the spread of the three runs of base and branch (`pnpm typecheck`: 3.3 to 3.6 s before, 3.4 to 3.7 s after), so the update neither slows nor speeds the checks.
- The move to 7 waits for a `typescript-eslint` that accepts it ([#351](https://github.com/AIssoufi/issoufi.fr/issues/351)).
