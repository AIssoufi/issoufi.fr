# 0020. Update Vitest to 5

- Date: 2026-10-22
- Status: Accepted

## Context

The site runs its unit and component tests with Vitest ([0003](0003-vite-and-vitest.md)), with its coverage measured by `@vitest/coverage-v8`, both declared as `^4.1.11`. Vitest 5.0.0 came out on 2026-09-03; 5.0.4 on 2026-10-12 and 5.0.5 on 2026-10-15. The 7 days of `minimumReleaseAge` let pnpm install 5.0.4 on 2026-10-22, and 5.0.5 later that day. `pnpm audit` reported 2 advisories on the base.

The changes of Vitest 5 that touch the project:

- `clearMocks` is on by default: the calls of every mock are cleared before each test.
- An asynchronous assertion, such as `resolves` or `rejects`, that the test does not await fails it, where Vitest 4 awaited it at the end and only warned.
- Vitest 5 counts the statements of the coverage with its own Istanbul packages.
- After the run, the default reporter prints performance hints: create jsdom once per worker with the `vmThreads` pool, or share the workers between files with `isolate: false`.

The other changes (`-t` matched against the names joined by `>`, `toThrow('')`, the titles of `test.each`, the removed `sequential` options and entry points, the browser mode, the `.vitest` folder of the reports, worker ids from 1) concern options, APIs and reporters that the project does not use.

## Decision

In the pull request of [#324](https://github.com/AIssoufi/issoufi.fr/issues/324), `vitest` and `@vitest/coverage-v8` go to `^5.0.4`. No spec changes: every one passes with the cleared mocks and the stricter assertions.

The config sets `pool: 'forks'` and `isolate: true`, the defaults, since Vitest prints no hint for an option set explicitly. With `--pool=vmThreads`, each spec runs in a realm of its own, whose values the native code of Rolldown and `instanceof` refuse: 58 tests fail in 11 files. With `--no-isolate`, the specs see the state that the previous ones left: 33 files fail, and the run does not end within 10 minutes.

## Alternatives considered

- **`^4.1.12`**, the patched release of Vitest 4, installable from 2026-10-22 at 14:51 UTC: it clears `pnpm audit` too, but keeps the project one major behind.
- **Waiting for 5.0.5**, installable at 14:29 UTC the same day: a patch release, which the range `^5.0.4` accepts and Dependabot proposes after its week of cooldown.
- **The `vmThreads` pool or `isolate: false`**, which the hints propose: both fail tests, as above.

## Consequences

Measured with Node.js 24.22.0 and `pnpm test:coverage --reporter=default --maxWorkers=4`, base and branch in turn after a clean install, medians of three runs; the duration is the one that Vitest reports. In the CI, the duration of `pnpm test:coverage` in the `test` job.

| Figure                         | Before (4.1.11) | After (5.0.4) |
| ------------------------------ | --------------- | ------------- |
| `pnpm test:coverage`, local    | 35.8 s          | 35.1 s        |
| `pnpm test:coverage`, CI       | 103.0 s         | 132.5 s       |
| Tests, in files                | 6,064, in 191   | 6,064, in 191 |
| Files measured by the coverage | 262             | 262           |
| Statements counted             | 4,680           | 4,669         |
| Coverage of the four metrics   | 100 %           | 100 %         |
| `pnpm audit` advisories        | 2 moderate      | 0             |

- The local durations range from 33.4 to 36.7 s before and from 33.4 to 35.7 s after: the update neither slows nor speeds the tests. In the CI, Vitest took from 80.0 to 138.4 s on the last eight runs of `develop`, and 132.5 s on the branch: the before is the median of the last three runs of `develop`, the after the run of the branch. The shared runners of GitHub vary more than the update moves the duration.
- Vitest 5 counts 11 statements and 10 lines fewer in 9 of the same files, and as many branches and functions.
- The output of `--reporter=default` keeps no warning, and the reporter that Vitest picks for an AI agent stays as compact as in Vitest 4.
- [docs/testing.md](../testing.md#pitfalls) describes the cleared mocks and the awaited assertions.
