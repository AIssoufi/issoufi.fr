# 0013. Test the built site in Chromium with Playwright

- Date: 2026-10-18
- Status: Accepted

## Context

The unit tests run in jsdom, which computes no layout: no width, no overflow, no position. A page wider than the screen on a phone ([#54](https://github.com/AIssoufi/issoufi.fr/issues/54)) passed every check of the CI, since no test could measure it.

## Decision

In [#112](https://github.com/AIssoufi/issoufi.fr/pull/112), merged on 2026-10-18:

- `@playwright/test` 1.64.0, with `playwright.config.ts`: Chromium only, on the built site that `pnpm preview` serves on the port of the worktree.
- `e2e/horizontal-overflow.e2e.ts` opens each route of `PAGES` and a not found path, in French and in English, at 320, 375, 414 and 1440 px, and fails when the page is wider than the screen. It waits for the lazy page, the network and the fonts before it measures.
- A `browser-test` job of the CI runs the tests on the `dist` artifact of the `build` job, with the headless shell of Chromium cached per version of Playwright. The deploy waits for it.

## Alternatives considered

The pull request records no alternative. The ones open then:

- **Vitest in browser mode**: it runs the unit tests in a real browser, on components rendered alone, not on the pages of the build that a visitor gets.
- **Cypress**: Chromium-based end-to-end tests too, with its own runner and no tests in parallel without its paid service.
- **Firefox and WebKit as well as Chromium**: two more browsers to install and run in each job, for a first test of the layout.

## Consequences

Counted on 2026-10-20 from the descriptions of #112 and [#298](https://github.com/AIssoufi/issoufi.fr/pull/298), with `pnpm exec playwright test --list` on `a152ac1`, and with `gh api 'repos/AIssoufi/issoufi.fr/actions/runs/<run>/jobs'` for the durations.

| Figure                       | Before | After #112                           | Up to #298, 2026-10-19                                                           | `a152ac1`, 2026-10-20 |
| ---------------------------- | ------ | ------------------------------------ | -------------------------------------------------------------------------------- | --------------------- |
| Browser tests                | 0      | 32 (4 routes, 4 widths, 2 languages) | 794, on the branch of #298                                                       | 901, in 30 files      |
| `browser-test` job of the CI |        | 66 s on 2026-10-18 (run 39109805301) | 3 shards of 2 min 56 s to 3 min 19 s, on `develop` before #298 (run 39297956504) | not measured          |

- The proof of #112: with the fixes of #54 reverted, the test fails on 4 of its 32 cases, one of them in English only.
- The browser tests became the place for what needs a layout: hydration, the background photo, the wide screens, reduced motion, accessibility with axe-core, and the comparison of screenshots with `develop` ([#275](https://github.com/AIssoufi/issoufi.fr/pull/275)) ([Testing](../testing.md)).
- The job split into three shards as the tests grew, and only Chromium runs them: Firefox and Safari stay untested.
