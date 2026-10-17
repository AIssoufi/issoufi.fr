# issoufi.fr

> Personal portfolio of **ADAM Issoufi** — Full-stack JavaScript developer with a passion for UX and UI Design. Live at [issoufi.fr](https://issoufi.fr/).

## 🛠 Tech Stack

| Category            | Technologies                    |
| ------------------- | ------------------------------- |
| **Framework**       | React 19                        |
| **Build**           | Vite 6                          |
| **Language**        | TypeScript 5                    |
| **Styling**         | styled-components 6 + xstyled 4 |
| **Routing**         | React Router 7                  |
| **i18n**            | i18next (French and English)    |
| **Tests**           | Vitest 3 + Testing Library      |
| **Package Manager** | pnpm                            |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`)
- [pnpm](https://pnpm.io/) 10.34.7, pinned by the `packageManager` field of `package.json`. Any recent pnpm switches to this version automatically inside the project.

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Production

```bash
pnpm build     # Type-check, then build to dist/
pnpm size      # Check the size of dist/ (run it after pnpm build)
pnpm preview   # Serve the production build locally
pnpm smoke-test https://issoufi.fr   # Check that a deployed site serves the pages of dist/
```

`pnpm size` fails when the scripts and style sheets of the build exceed 250 kB gzip, and warns about images over 500 kB. Both limits are in `scripts/ci/constants.mjs`.

`pnpm smoke-test <site URL>` requests every page of `dist/` on the site, plus an unknown path, and fails unless each answers with the expected status (200, or 404 for the unknown path) and the title and canonical URL of the build. It retries for about 20 seconds while a new deployment spreads.

### Tests

```bash
pnpm test            # Single run
pnpm test:watch      # Watch mode
pnpm test:coverage   # Single run with coverage, HTML report in coverage/index.html
```

Tests are `*.spec.jsx` / `*.spec.ts` files next to the code they test. Every component has one. `pnpm test:coverage` fails when the coverage of `src/` drops below the thresholds of `vite.config.ts` (`COVERAGE_THRESHOLDS`).

### Checks

```bash
pnpm typecheck      # Type-check without building
pnpm lint           # Lint with ESLint
pnpm format:check   # Check that every file follows the Prettier style
pnpm format         # Format every file with Prettier
```

On commit, a husky hook runs ESLint (with `--fix`) and then Prettier on the staged files, and stops the commit on a lint error. `pnpm format` is only needed for files changed outside git.

## 🌐 Deployment

The site is hosted on [Cloudflare Pages](https://pages.cloudflare.com/), in the `issoufi-fr` project, at [issoufi.fr](https://issoufi.fr/). The CI deploys it with Wrangler once every check has passed, so only a tested build goes online:

| Event             | Cloudflare deployment                                                             | GitHub environment |
| ----------------- | --------------------------------------------------------------------------------- | ------------------ |
| Push to `main`    | Production, at [issoufi.fr](https://issoufi.fr/)                                  | `production`       |
| Push to `develop` | Preview, at [develop.issoufi-fr.pages.dev](https://develop.issoufi-fr.pages.dev/) | `preview`          |
| Pull request      | Preview, at `<branch>.issoufi-fr.pages.dev`                                       | `preview`          |

- **Deploy job**: uploads the `dist` artifact of the build job with `cloudflare/wrangler-action`. It needs the `CLOUDFLARE_API_TOKEN` (permission _Account → Cloudflare Pages → Edit_) and `CLOUDFLARE_ACCOUNT_ID` repository secrets, and is skipped with a notice without them. Pull requests from forks and from Dependabot get no secrets, so no preview.
- **Smoke test job**: runs `pnpm smoke-test` on the new deployment. For production, it also checks [issoufi.fr](https://issoufi.fr/) itself, and that `http://issoufi.fr` and `https://www.issoufi.fr` redirect to `https://issoufi.fr/`.
- **Manual deployment**: _Actions → CI → Run workflow_ rebuilds and redeploys a branch.
- **Cloudflare builds**: the project stays connected to the repository, but its automatic builds are paused (_Settings → Build → Branch control_), so Cloudflare does not build the site a second time. The settings below only apply to a build started from the Cloudflare dashboard.

| Setting                | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| Production branch      | `main`                                                         |
| Framework preset       | None                                                           |
| Root directory         | `/` (default)                                                  |
| Build command          | `pnpm build`                                                   |
| Build output directory | `dist`                                                         |
| Node.js version        | `24`, read from `.nvmrc`                                       |
| Package manager        | pnpm, detected from `pnpm-lock.yaml`                           |
| Environment variables  | `PNPM_VERSION=10.34.7` (same major version as the CI, pnpm 10) |

- **One HTML file per page**: at build time, a Vite plugin (`vite.config.ts`) fills the `%PAGE_*%` placeholders of `index.html` and emits `projects.html` and `experiences.html` from the same template. Each page gets its own title, description and canonical URL, taken from the `meta` translations of `src/i18n/fr.ts`, so link previews and search engines get them without running JavaScript. Cloudflare Pages serves these files at `/projects` and `/experiences`. A new route needs an entry in `PAGES` (`src/utils/pages.ts`).
- **Not found pages**: the plugin also emits `404.html`, with the "page not found" title and a `noindex` tag. Cloudflare Pages serves it with a real `404` status for any path that matches no file. The URL is kept, with no redirect, and the app shows its NotFound page. Because `404.html` exists, Cloudflare's single-page-app fallback is off, which is why every route needs its own HTML file.
- **Years of experience**: the number in the generated HTML files is computed at build time from `CAREER_START_DATE` (`src/utils/career.ts`), so it only changes with a new build. The workflow `.github/workflows/rebuild.yml` runs the CI on `main` on the first day of every month, which rebuilds and redeploys production, so the number is right from June 1st, the career anniversary. GitHub disables scheduled workflows after 60 days without activity on the repository: if that happens, re-enable it from the Actions tab. The app itself computes the number at runtime.
- **Continuous integration**: the GitHub Actions workflow `.github/workflows/ci.yml` checks the formatting, lints, type-checks, tests and builds every push to `main` and `develop` and every pull request. The test job measures the coverage, adds its total to the job summary and keeps the HTML report as the `coverage` artifact for 14 days. The build job runs `pnpm size`, which adds the size of each script to the job summary and annotates the images to compress. The scripts behind these summaries live in `scripts/ci/`. On pull requests, it also checks the commit messages with commitlint (except Dependabot's) and runs GitHub's dependency review, which fails when a change brings in a dependency with a known vulnerability. Each job installs pnpm, Node.js and the dependencies with the composite action `.github/actions/setup`, which reads the versions from `package.json` and `.nvmrc` and caches the pnpm store. When everything passes, it deploys the build (see above).
- **Dependency updates**: Dependabot (`.github/dependabot.yml`) opens weekly pull requests against `develop`: one for all minor and patch npm updates, one per major version, and one for the GitHub Actions. A release is only proposed once it is 7 days old, and pnpm applies the same rule to every install (`minimumReleaseAge` in `pnpm-workspace.yaml`), so a version published days ago never reaches the lockfile. Security updates target the default branch, `develop`, too.
- **Former address**: `https://aissoufi.github.io` is served by the [AIssoufi/AIssoufi.github.io](https://github.com/AIssoufi/AIssoufi.github.io) repository, which redirects every path to the same path on `https://issoufi.fr`.

## 🏷 Releases

[`CHANGELOG.md`](CHANGELOG.md) is written by [release-please](https://github.com/googleapis/release-please) from the Conventional Commits, never by hand:

1. Each push to `develop` updates a release pull request against `develop` (_chore: release x.y.z_), with the next version in `package.json` and the new `CHANGELOG.md` entry. The workflow `.github/workflows/release.yml` maintains it. GitHub Actions opens it, so GitHub may hold its CI like a first-time contributor's: click _Approve workflows to run_ on the pull request, since its checks are required to merge it.
2. Merging it tags the version (`vX.Y.Z`) and publishes a GitHub release.
3. A pull request from `develop` to `main` then puts the release in production.

The version follows the commits: `fix` bumps the patch version, `feat` the minor version, and a breaking change (`feat!:` or a `BREAKING CHANGE:` footer) the major version. The changelog lists features, fixes, performance improvements, reverts, refactors and documentation; `build`, `ci`, `test`, `style` and `chore` commits stay out of it (`release-please-config.json`). It starts with the React 19 and Vite rewrite of March 2026.

## 📁 Project Structure

```
src/
├── App/                  # Root component, router and layout
│   ├── DocumentMeta/     # <html lang>, title and description per route and language
│   ├── Header/           # Logo, navigation and burger menu
│   ├── LangToggle/       # FR / EN switch
│   └── Modal/            # Informational modal (unused)
├── components/           # Components shared across pages
│   └── StatusMessage/    # Code, title, message and home link of error pages
├── i18n/                 # French and English translations
├── pages/
│   ├── Home/             # Landing page: animated title, particle background, hooks/ for effects
│   ├── Projects/         # Personal and freelance projects, data in .data/*.json
│   ├── Experiences/      # Work experience timeline
│   ├── NotFound/         # 404 page, shown at the requested URL
│   └── Forbidden/        # 403 page, not routed yet
├── theme/                # Design tokens (tokens.ts, theme.ts) and global styles
├── utils/                # Career dates and page metadata helpers
└── index.tsx             # Entry point
```

## 📝 Conventions

- **Branches**: `main` is production and `develop`, the default branch, the integration branch. A ruleset protects both: changes go through a pull request whose CI checks pass, and force pushes and deletions are refused. The `production` environment only accepts deployments from `main`. Each ticket gets its own branch from `develop` (`feat/…`, `fix/…`, `ci/…`), merged back into `develop` by a pull request once the CI passes. A release is a pull request from `develop` to `main`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) enforced via commitlint. They also set the next version and the changelog (see Releases).
- **Linting**: ESLint (`eslint.config.js`) with the recommended rules of ESLint and typescript-eslint, React Hooks (including the React Compiler rules) and React Refresh. It also forbids importing `styled-components` directly.
- **Formatting**: Prettier (via lint-staged + husky)
- **Language**: code, comments and docs are in English. Only user-facing texts are translated.
- **Styles**: styled-components read every color, spacing, font, radius, shadow, duration and breakpoint from the design tokens of `src/theme` with the [xstyled](https://xstyled.dev/) `th` helpers (`th.color('accent')`, `th.space(16)`, `th.radius('md')`…). No hard-coded values, and every styled-components API is imported from `@xstyled/styled-components`.
- **Components**: one folder per component (`Name.tsx`, `Name.spec.jsx`, `Name.styled.ts`, `index.ts`), optional props that tolerate missing values, and JSDoc on every component and prop. See [`CLAUDE.md`](CLAUDE.md) for the details.
