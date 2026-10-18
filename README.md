# issoufi.fr

> Personal portfolio of **ADAM Issoufi** — Full-stack JavaScript developer with a passion for UX and UI Design. Live at [issoufi.fr](https://issoufi.fr/).

## 🛠 Tech Stack

| Category            | Technologies                    |
| ------------------- | ------------------------------- |
| **Framework**       | React 19                        |
| **Build**           | Vite 6                          |
| **Language**        | TypeScript 5                    |
| **Styling**         | styled-components 6 + xstyled 4 |
| **Routing**         | React Router 8                  |
| **i18n**            | i18next (French and English)    |
| **Tests**           | Vitest 4 + Testing Library      |
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

The app will be available at [http://localhost:3000](http://localhost:3000), and opens in the browser unless `BROWSER=none` is set.

**Ports**: `pnpm dev` listens on 3000 and `pnpm preview` on Vite's default port, 4173, unless a `PORT` variable is set, in the environment or in `.env.local`. Then both use it. Each Worktrunk worktree gets its own: when the worktree is created, `.config/wt.toml` writes `PORT=<port>` to its `.env.local` (gitignored), a port between 10000 and 19999 derived from the branch name, so it stays the same for the branch and several worktrees can serve the app at the same time. Read the port of a worktree in its `.env.local`, or override it for one run with `PORT=4000 pnpm dev`. An empty or invalid `PORT` is ignored (`vite/utils.ts`). When the port is taken, `pnpm dev` and `pnpm preview` stop with an error instead of moving to another port (`strictPort`), so a test never reaches the server of another worktree by mistake: stop the server that holds the port, or pick another one with `PORT`.

### Production

```bash
pnpm build     # Type-check, then build to dist/
pnpm size      # Check the size of dist/ (run it after pnpm build)
pnpm preview   # Serve the production build locally
pnpm smoke-test https://issoufi.fr   # Check that a deployed site serves the pages of dist/
```

`pnpm size` fails when the scripts and style sheets of the build exceed 250 kB gzip, and warns about images over 500 kB. Both limits are in `scripts/ci/constants.mjs`.

`pnpm smoke-test <site URL>` requests every page of `dist/` on the site, plus an unknown path, and fails unless each answers with the expected status (200, or 404 for the unknown path) and the title and canonical URL of the build. It retries for about 20 seconds while a new deployment spreads, and fails at once when `dist/` is missing or holds no HTML page.

### Tests

```bash
pnpm test            # Single run
pnpm test:watch      # Watch mode
pnpm test:coverage   # Single run with coverage, HTML report in coverage/index.html
```

Tests are `*.spec.jsx` (components), `*.spec.ts` (helpers and hooks) and `*.spec.js` (CI helpers and the test helpers of `src/pages/testUtils.js`) files next to the code they test. Every component has one. `pnpm test:coverage` fails when the coverage of `src/`, of the Vite config helpers (`vite/`) and of the CI helpers (`scripts/ci/utils/`) drops below the thresholds of `vite.config.ts` (`COVERAGE_THRESHOLDS_PERCENT`).

### Checks

```bash
pnpm typecheck      # Type-check src/ and vite/, then the CI scripts of scripts/, without building
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
- **Smoke test job**: runs `node scripts/ci/smoke-test.mjs` (the script behind `pnpm smoke-test`) on the new deployment. The script needs no dependency, so the job only sets up Node.js and downloads the `dist` artifact. For production, it also checks [issoufi.fr](https://issoufi.fr/) itself, and that `http://issoufi.fr` and `https://www.issoufi.fr` redirect to `https://issoufi.fr/`.
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

- **One HTML file per page**: at build time, a Vite plugin (`vite.config.ts`) fills the `%PAGE_*%` placeholders of `index.html` and emits `projects.html` and `experiences.html` from the same template. Each page gets its own title, description and canonical URL, taken from the `meta` translations of `src/i18n/fr.ts`, so link previews and search engines get them without running JavaScript. Every page shares the same link preview image, `public/og-image.png` (1200×630, under 300 kB, checked by `src/utils/pages.spec.ts`), composed from the home hero: update it when the hero changes. Cloudflare Pages serves these files at `/projects` and `/experiences`. A new route needs an entry in `PAGES` (`src/utils/pages.ts`).
- **Language**: the generated pages are in French, the language of a first visit. The FR / EN toggle stores the visitor's choice in `localStorage` (`language` key, `src/i18n/storage.ts`), and the app reads it before its first render, so a reload or a later visit opens in that language, with the title, `lang` attribute and description to match. When the browser blocks the storage, the site opens in French, and a language chosen with the toggle only lasts until the next reload.
- **Not found pages**: the plugin also emits `404.html`, with the "page not found" title and a `noindex` tag. Cloudflare Pages serves it with a real `404` status for any path that matches no file. The URL is kept, with no redirect, and the app shows its NotFound page. Because `404.html` exists, Cloudflare's single-page-app fallback is off, which is why every route needs its own HTML file.
- **Years of experience**: the number in the generated HTML files is computed at build time from `CAREER_START_DATE` (`src/utils/career.ts`), so it only changes with a new build. The workflow `.github/workflows/rebuild.yml` runs the CI on `main` on the first day of every month, which rebuilds and redeploys production, so the number is right from June 1st, the career anniversary. GitHub disables scheduled workflows after 60 days without activity on the repository: if that happens, re-enable it from the Actions tab. The app itself computes the number at runtime.
- **Continuous integration**: the GitHub Actions workflow `.github/workflows/ci.yml` checks the formatting, lints, type-checks, tests and builds every push to `main` and `develop` and every pull request. The test job measures the coverage, adds its total to the job summary and keeps the HTML report as the `coverage` artifact for 14 days. The build job runs `pnpm size`, which adds the size of each script to the job summary and annotates the images to compress. The scripts behind these summaries live in `scripts/ci/`. On pull requests, it also checks the commit messages with commitlint (except Dependabot's) and runs GitHub's dependency review, which fails when a change brings in a dependency with a known vulnerability. The jobs that need the dependencies (format, lint, type-check, test, commit messages and build) install pnpm, Node.js and the dependencies with the composite action `.github/actions/setup`, which reads the versions from `package.json` and `.nvmrc` and caches the pnpm store. The other jobs (dependency review, credentials check, deployment and smoke test) do without. When everything passes, it deploys the build (see above).
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
.
├── .config/
│   └── wt.toml           # Worktrunk: installs the dependencies and writes the port of each worktree
├── .github/
│   ├── actions/setup/    # Composite action: pnpm, Node.js and the dependencies, with a cache
│   ├── workflows/        # ci.yml (checks, build, deployment, smoke test), release.yml, rebuild.yml
│   └── dependabot.yml    # Weekly dependency updates against develop
├── .husky/               # Git hooks: lint-staged before a commit, commitlint on its message
├── public/               # Images, link preview image, CV, favicon, manifest and robots.txt, copied as is to dist/
├── scripts/
│   ├── ci/               # CI scripts: bundle size, coverage summary, smoke test
│   │   ├── utils/        # Their helpers, one file per topic, each with its spec
│   │   └── constants.mjs # Budgets, file patterns and smoke test settings
│   └── tsconfig.json     # Type-checks the scripts, run by pnpm typecheck
├── src/
│   ├── App/              # Root component, router and layout
│   │   ├── DocumentMeta/ # <html lang>, title and description per route and language
│   │   └── Header/       # Logo, navigation, burger menu and LangToggle/ (FR / EN switch)
│   ├── components/       # Components shared across pages
│   │   ├── Page/         # Layout section that every page extends with styled(Page)
│   │   └── StatusMessage/ # Code, title, message and home link of error pages
│   ├── i18n/             # French and English translations, and the storage of the chosen language
│   ├── pages/
│   │   ├── Home/         # Landing page: animated title, particle background, hooks/ for effects
│   │   ├── Projects/     # Personal and freelance projects, data in .data/*.json
│   │   ├── Experiences/  # Work experience timeline
│   │   ├── NotFound/     # 404 page, shown at the requested URL
│   │   ├── Forbidden/    # 403 page, not routed yet
│   │   └── testUtils.js  # Helpers shared by the page tests, e.g. isPublicFile
│   ├── theme/            # Design tokens (tokens.ts, theme.ts) and global styles
│   ├── utils/            # Career dates and page metadata helpers
│   └── index.tsx         # Entry point
├── vite/                 # Helpers of vite.config.ts: dev and preview ports
├── index.html            # HTML template of every page, filled at build time by vite.config.ts
└── vite.config.ts        # Vite, the plugin that writes one HTML file per page, Vitest and coverage
```

## 📝 Conventions

- **Branches**: `main` is production and `develop`, the default branch, the integration branch. A ruleset protects both: changes go through a pull request whose CI checks pass, and force pushes and deletions are refused. The `production` environment only accepts deployments from `main`. Each ticket is worked on in its own [Worktrunk](https://worktrunk.dev) worktree next to the repository (`AIssoufi.github.io.ISF-35`), on a branch named after its reference: the `ISF-` autolink turns `ISF-35` into a link to issue #35. The branch starts from `develop` (`wt switch --create ISF-35 --base develop`) and goes back into it through a pull request that says `Closes #35`, once the CI passes. `.config/wt.toml` installs the dependencies of each new worktree and writes its port to `.env.local` (see Development). A release is a pull request from `develop` to `main`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) enforced via commitlint. They also set the next version and the changelog (see Releases).
- **Linting**: ESLint (`eslint.config.js`) with the recommended rules of ESLint and typescript-eslint, React Hooks (including the React Compiler rules) and React Refresh. It also forbids importing `styled-components` directly, and importing the style file of a component (`Name.styled`) from outside its folder.
- **Formatting**: Prettier (via lint-staged + husky)
- **Language**: code, comments and docs are in English. Only user-facing texts are translated.
- **Styles**: styled-components read every color, spacing, font, radius, shadow, duration and breakpoint from the design tokens of `src/theme` with the [xstyled](https://xstyled.dev/) `th` helpers (`th.color('accent')`, `th.space(16)`, `th.radius('md')`…). No hard-coded values, and every styled-components API is imported from `@xstyled/styled-components`.
- **Components**: one folder per component (`Name.tsx`, `Name.spec.jsx`, `Name.styled.ts`, `index.ts`), styles imported only by their own component, optional props that tolerate missing values, and JSDoc on every component and prop. See [`CLAUDE.md`](CLAUDE.md) for the details.
