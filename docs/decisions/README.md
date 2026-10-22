# Decisions

One Architecture Decision Record (ADR) per change of tool or of architecture: why the project changed, what it weighed, and what the change gave, in figures. The history they make up, era by era, is in [Evolution](../evolution.md).

## When an ADR is due

- **Due**: a change of tool or of architecture, such as a framework, a build tool, a test runner, a package manager, a language, a host, or the way the site is rendered, deployed or released.
- **Not due**: a version update of a tool already used, a library for one feature, or a choice inside the code (a helper, a component, a test).
- The pull request that makes the change writes its ADR, with the next free number, and its step of [`docs/evolution.md`](../evolution.md).
- Its ticket measures the figures that the change moves before the first commit, on the base of the branch, then again on the final state, with the same command on the same machine.

## Template

`docs/decisions/NNNN-short-title.md`, four digits, numbered in the order of the decisions:

```markdown
# NNNN. <Decision in a few words>

- Date: YYYY-MM-DD (the merge day; for a record written later, the day of the commit)
- Status: Accepted | Superseded by [NNNN](NNNN-short-title.md)

## Context

What the project used, and the problem it caused.

## Decision

What changed, and in which pull request or commits.

## Alternatives considered

Each option rejected, with its reason.

## Consequences

The figures before and after, with the command or the source of each, what got better, what it costs, and what is left to do.
```

An ADR is not rewritten later: a new decision supersedes it, and the old one gets its new status. A figure is measured or quoted from its source, never estimated: write "not measured" when it cannot be.

## Records

| ADR                                              | Date       | Decision                                               |
| ------------------------------------------------ | ---------- | ------------------------------------------------------ |
| [0001](0001-typescript.md)                       | 2024-02-16 | Write the app in TypeScript                            |
| [0002](0002-prettier-and-commitlint.md)          | 2024-02-17 | Format with Prettier and check the commit messages     |
| [0003](0003-vite-and-vitest.md)                  | 2026-03-21 | Build with Vite and test with Vitest                   |
| [0004](0004-pnpm.md)                             | 2026-03-21 | Install the dependencies with pnpm                     |
| [0005](0005-styled-components.md)                | 2026-03-21 | Style the components with styled-components            |
| [0006](0006-assets-in-public.md)                 | 2026-03-21 | Serve the images and the CV from the site              |
| [0007](0007-github-pages.md)                     | 2026-03-25 | Deploy to GitHub Pages from GitHub Actions             |
| [0008](0008-html-file-per-route.md)              | 2026-10-17 | Write one HTML file per route                          |
| [0009](0009-cloudflare-pages.md)                 | 2026-10-17 | Host on Cloudflare Pages, deployed from GitHub Actions |
| [0010](0010-xstyled-design-tokens.md)            | 2026-10-17 | Read the styles from xstyled design tokens             |
| [0011](0011-eslint.md)                           | 2026-10-17 | Lint the code with ESLint                              |
| [0012](0012-release-please.md)                   | 2026-10-17 | Version and release with release-please                |
| [0013](0013-playwright-browser-tests.md)         | 2026-10-18 | Test the built site in Chromium with Playwright        |
| [0014](0014-daily-deploy.md)                     | 2026-10-18 | Deploy `develop` to production every morning           |
| [0015](0015-render-at-build-time.md)             | 2026-10-19 | Render each page at build time and hydrate it          |
| [0016](0016-cloudflare-worker-deploy-trigger.md) | 2026-10-20 | Start the daily deploy from a Cloudflare Worker        |
| [0017](0017-typescript-6.md)                     | 2026-10-21 | Update TypeScript to 6                                 |
| [0018](0018-pnpm-12.md)                          | 2026-10-21 | Update pnpm to 12                                      |
| [0019](0019-locked-build-chain.md)               | 2026-10-22 | Lock wrangler and pin the actions of third parties     |
| [0020](0020-vitest-5.md)                         | 2026-10-22 | Update Vitest to 5                                     |
| [0021](0021-knip.md)                             | 2026-10-22 | Report unused files and exports with knip              |
