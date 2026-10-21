# Evolution

How the tools of the site changed, era by era, from the first commit to today. Each change of tool has its record in [Decisions](decisions/README.md), with its context, the options it weighed and its own figures; this page puts them in order and shows what each era changed as a whole.

## How the figures were measured

Every figure below was measured on 2026-10-20, or read from the source it names. Nothing is estimated: a figure that could not be measured says "not measured" and why.

- **Worktrees**: a detached worktree of each commit, installed clean with `npm ci` or `pnpm install --frozen-lockfile`, with the same Node.js version for both columns of a table, which each table names.
- **Build time**: not given here. The bounds of each era were built in turn, three times each, after deleting `node_modules/.cache` and the build folder, but the machine ran the builds of other projects at the same time: the runs of one commit differed by up to 5.4 s, more than the gap between the bounds of any era. The record of each change that alters the build gives its own time.
- **Sizes**: the sum of the `.js` and `.css` files of the build folder, source maps left out, each gzipped with `gzip -c <file> | wc -c`. **First load**: the scripts and styles that `index.html` loads, gzipped with the `gzipSync` of Node.js, as `pnpm size` counts them. **HTML files**: the `*.html` files of the build folder; the size of one is `gzip -c <file> | wc -c`, and its `h1` the matches of `<h1` in it.
- **Unit tests**: those that the test runner reports passing, Jest through `react-scripts test` and then Vitest through `pnpm test`, and for the later commits the entries of `vitest list --json`. **Browser tests**: `playwright test --list`.
- **Files**: `git ls-tree -r --name-only <commit> -- src`. **Dependencies**: the keys of `dependencies` and `devDependencies` in `package.json`.
- **Advisories**: those that `npm audit` or `pnpm audit` reports on 2026-10-20 for the lockfile of the commit, so those known today, not at the time. The two tools count them differently, so a number of npm and one of pnpm compare only roughly.
- **Commits and pull requests**: `git rev-list --count`, merges included, and the `Merge pull request` commits on the first parent of each range.
- **Lighthouse**: Lighthouse 12.8.2, the performance category on a mobile with simulated throttling, on `/` of the build served from 127.0.0.1 by a small Node.js server that gzips the text files as the hosts do. The median of three runs, the commits of a table in turn. The network and the CDN of the host are left out, so these are not the figures of the live site.

## 1. 2021 to 2024: Create React App in JavaScript

The first commit, `4ee7e5c` on 2021-01-29, holds a Create React App 4.0.1 app in JavaScript, with React 17 and React Router 5. Twenty commits build it up to 2021-02-04, and five more on 2024-02-16 tidy it before the move to TypeScript: 25 commits, no pull request, no CI and no deployment in the repository.

Measured with Node.js 16.20.2.

| Figure                    | Before (`4ee7e5c`, 2021-01-29) | After (`0848698`, 2024-02-16) |
| ------------------------- | ------------------------------ | ----------------------------- |
| Files in `src/`           | 35                             | 49                            |
| Test files                | 1                              | 1                             |
| Direct dependencies (dev) | 9 (0)                          | 10 (4)                        |
| First load, gzip          | not measured                   | 127.9 kB                      |
| JavaScript, gzip          | not measured                   | 125.2 kB                      |
| CSS, gzip                 | not measured                   | 3.3 kB                        |

`4ee7e5c` is not measured beyond its files: `npm ci` refuses its lockfile, whose `type-fest@0.11.0` does not satisfy the `type-fest@0.13.1` that its `package.json` asks for.

Decision: none, this is the starting point of the history.

## 2. 2024 to 2026: TypeScript and Create React App 5

On 2024-02-16, React 18, Create React App 5 and TypeScript replace the JavaScript app; on 2024-02-17, Prettier formats the code and commitlint checks the commit messages. Eight commits, pushed with no pull request, then none until 2026-03-21.

Measured with Node.js 16.20.2.

| Figure                         | Before (`0848698`)        | After (`6674b92`)        |
| ------------------------------ | ------------------------- | ------------------------ |
| Language                       | JavaScript                | TypeScript 4.9           |
| First load, gzip               | 127.9 kB                  | 152.7 kB                 |
| JavaScript, gzip               | 125.2 kB                  | 147.9 kB                 |
| CSS, gzip                      | 3.3 kB                    | 4.4 kB                   |
| Unit tests                     | 1                         | 1                        |
| Files in `src/`                | 49                        | 57                       |
| Direct dependencies (dev)      | 10 (4)                    | 24 (16)                  |
| `npm audit` advisories in 2026 | 212, of which 22 critical | 101, of which 4 critical |

Decision: [0001](decisions/0001-typescript.md), [0002](decisions/0002-prettier-and-commitlint.md).

## 3. 2026-03-21 to 2026-10-16: Vite, pnpm and GitHub Pages

On 2026-03-21, Vite 6 and Vitest replace Create React App, with React 19 and React Router 7; pnpm replaces npm; styled-components replaces the CSS files and Tailwind; the images and the CV move from Firebase Storage into `public/`. On 2026-03-25, GitHub Actions deploys the site to GitHub Pages, and i18next brings the English version (`ce3490f`), a library with no record of its own. 35 commits, one pull request: the update of the dependencies of 2026-08-01 ([#10](https://github.com/AIssoufi/issoufi.fr/pull/10)).

Measured with Node.js 20.13.1.

| Figure                    | Before (`6674b92`)             | After (`aa8229b`)                 |
| ------------------------- | ------------------------------ | --------------------------------- |
| Build tool                | Create React App 5 (webpack)   | Vite 6                            |
| Package manager           | npm                            | pnpm                              |
| Deployment                | none in the repository         | GitHub Pages, from GitHub Actions |
| First load, gzip          | 152.7 kB                       | 205.3 kB                          |
| JavaScript, gzip          | 147.9 kB                       | 204.1 kB                          |
| CSS, gzip                 | 4.4 kB                         | 0.7 kB                            |
| Unit tests                | 1                              | 22, in 3 files                    |
| Files in `src/`           | 57                             | 70                                |
| Direct dependencies (dev) | 24 (16)                        | 26 (18)                           |
| Advisories in 2026        | 101 by `npm audit`, 4 critical | 19 by `pnpm audit`, 2 critical    |
| Lighthouse score, `/`     | not measured                   | 88                                |
| LCP, simulated, `/`       | not measured                   | 3.16 s                            |

`6674b92` has no Lighthouse figure: its images load from Firebase Storage, which answers HTTP 402 today, so a run would measure the page without them. `aa8229b` still loads its fonts from Google Fonts, which the runs requested over the network. Its runs served the build of Node.js 24.22.0, whose scripts and styles have the same gzipped sizes as the build of Node.js 20.13.1.

The JavaScript grows in three steps, each measured in its record or here: 175.1 kB with Vite and React 19 ([0003](decisions/0003-vite-and-vitest.md), Node.js 20.13.1), 178.1 kB with styled-components ([0005](decisions/0005-styled-components.md), Node.js 22.14.0), and 203.6 kB at `8580dfd` on 2026-03-25, after i18next (Node.js 22.14.0).

Decision: [0003](decisions/0003-vite-and-vitest.md), [0004](decisions/0004-pnpm.md), [0005](decisions/0005-styled-components.md), [0006](decisions/0006-assets-in-public.md), [0007](decisions/0007-github-pages.md).

## 4. 2026-10-17 to 2026-10-19: Cloudflare, CI, tokens and browser tests

From 2026-10-17, the work goes through pull requests: 135 of them and 899 commits in three days, up to the one before [#298](https://github.com/AIssoufi/issoufi.fr/pull/298). The build writes one HTML file per route and Cloudflare Pages hosts the site, deployed from GitHub Actions; the styles read xstyled design tokens; ESLint lints the code; release-please versions it; Playwright tests the built site in Chromium; and `develop` reaches production every morning. Other changes of the era have no record of their own, since they update or set up tools already used, or turn on a feature of GitHub: `develop` with Dependabot and the CI ([#30](https://github.com/AIssoufi/issoufi.fr/pull/30)), the coverage thresholds and the size budget ([#31](https://github.com/AIssoufi/issoufi.fr/pull/31)), React Router 8 ([#57](https://github.com/AIssoufi/issoufi.fr/pull/57)), one chunk per route ([#106](https://github.com/AIssoufi/issoufi.fr/pull/106)), Vite 8 with Rolldown ([#263](https://github.com/AIssoufi/issoufi.fr/pull/263)) and the comparison of screenshots with `develop` ([#275](https://github.com/AIssoufi/issoufi.fr/pull/275)).

Measured with Node.js 24.22.0.

| Figure                          | Before (`aa8229b`)      | After (`ad044eb`)   |
| ------------------------------- | ----------------------- | ------------------- |
| Host                            | GitHub Pages            | Cloudflare Pages    |
| Build tool                      | Vite 6                  | Vite 8              |
| HTML files of the build         | 1                       | 8                   |
| First load, gzip                | 205.3 kB                | 146.4 kB            |
| JavaScript, gzip                | 204.1 kB                | 158.9 kB            |
| CSS, gzip                       | 0.7 kB                  | 0 kB                |
| Unit tests                      | 22, in 3 files          | 5,280, in 167 files |
| Browser tests                   | 0                       | 775, in 25 files    |
| Files in `src/`                 | 70                      | 328                 |
| Direct dependencies (dev)       | 26 (18)                 | 35 (28)             |
| `pnpm audit` advisories in 2026 | 19, of which 2 critical | 0                   |
| Lighthouse score, `/`           | 88                      | 97                  |
| LCP, simulated, `/`             | 3.16 s                  | 2.33 s              |

The first load falls by 58.9 kB, and the JavaScript of the whole build by 45.2 kB; the share of each pull request in these falls is not measured.

Decision: [0008](decisions/0008-html-file-per-route.md), [0009](decisions/0009-cloudflare-pages.md), [0010](decisions/0010-xstyled-design-tokens.md), [0011](decisions/0011-eslint.md), [0012](decisions/0012-release-please.md), [0013](decisions/0013-playwright-browser-tests.md), [0014](decisions/0014-daily-deploy.md).

## 5. Since 2026-10-19: pages rendered at build time

On 2026-10-19, [#298](https://github.com/AIssoufi/issoufi.fr/pull/298) renders each page at build time, and the browser hydrates it. On 2026-10-20, a Cloudflare Worker starts the daily deploy ([#333](https://github.com/AIssoufi/issoufi.fr/pull/333)). Up to `a152ac1`, the merge of #333: 16 pull requests and 61 commits.

Measured with Node.js 24.22.0.

| Figure                          | Before (`ad044eb`)  | After (`a152ac1`)                                           |
| ------------------------------- | ------------------- | ----------------------------------------------------------- |
| `index.html`, gzip              | 1.3 kB              | 9.2 kB                                                      |
| `projects.html`, gzip           | 1.2 kB              | 10.8 kB                                                     |
| `h1` in `projects.html`         | 0                   | 1                                                           |
| First load, gzip                | 146.4 kB            | 148.9 kB                                                    |
| JavaScript, gzip                | 158.9 kB            | 162.8 kB                                                    |
| Unit tests                      | 5,280, in 167 files | 5,735, in 182 files                                         |
| Browser tests                   | 775, in 25 files    | 901, in 30 files                                            |
| `pnpm audit` advisories in 2026 | 0                   | 0                                                           |
| Lighthouse score, `/`           | 97                  | 99                                                          |
| LCP, simulated, `/`             | 2.33 s              | 2.18 s                                                      |
| FCP, simulated, `/`             | 1.81 s              | 0.62 s                                                      |
| Start of the daily deploy       | crons of GitHub     | a Cloudflare Worker, with the crons of GitHub as a fallback |

On 2026-10-21, TypeScript goes from 5.9.3 to 6.0.3 ([#352](https://github.com/AIssoufi/issoufi.fr/pull/352)), with no change of the code nor of the tsconfig files. TypeScript 7 waits for `typescript-eslint`, which accepts no version from 6.1.0.

| Figure                  | Before (5.9.3) | After (6.0.3) |
| ----------------------- | -------------- | ------------- |
| `pnpm typecheck`        | 3.5 s          | 3.7 s         |
| `pnpm build`            | 3.9 s          | 4.2 s         |
| `pnpm audit` advisories | 0              | 0             |

On 2026-10-21, pnpm goes from 10.34.7 to 12.14.0 ([#354](https://github.com/AIssoufi/issoufi.fr/pull/354)), with `pmOnFail: ignore`, which keeps `pnpm-lock.yaml` one document so that the dependency graph of GitHub still sees the dependencies. The duration of the CI is in the pull request.

| Figure                  | Before (10.34.7) | After (12.14.0) |
| ----------------------- | ---------------- | --------------- |
| Clean install           | 1.8 s            | 0.7 s           |
| `pnpm audit` advisories | 0                | 0               |

On 2026-10-22, the deploy runs the wrangler of the lockfile instead of the latest one that it installed at each run, and the workflows reference the actions of third parties by the SHA of a commit instead of a tag ([#359](https://github.com/AIssoufi/issoufi.fr/issues/359)). The duration of the CI is in the pull request.

| Figure                     | Before                     | After                      |
| -------------------------- | -------------------------- | -------------------------- |
| `deploy` job in CI, median | 22 s                       | 26 s                       |
| Cache of the pnpm store    | 98.3 MB                    | 156.2 MB                   |
| wrangler of the deploy     | the latest 4.x at each run | 4.151.0, from the lockfile |
| Clean install              | 0.5 s                      | 0.5 s                      |
| `pnpm audit` advisories    | 2 moderate                 | 2 moderate                 |

Decision: [0015](decisions/0015-render-at-build-time.md), [0016](decisions/0016-cloudflare-worker-deploy-trigger.md), [0017](decisions/0017-typescript-6.md), [0018](decisions/0018-pnpm-12.md), [0019](decisions/0019-locked-build-chain.md).
