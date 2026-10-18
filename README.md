# issoufi.fr

> Personal portfolio of **ADAM Issoufi** — Full-stack JavaScript developer with a passion for UX and UI Design. Live at [issoufi.fr](https://issoufi.fr/).

## 🛠 Tech Stack

| Category            | Technologies                                        |
| ------------------- | --------------------------------------------------- |
| **Framework**       | React 19                                            |
| **Build**           | Vite 6                                              |
| **Language**        | TypeScript 5                                        |
| **Styling**         | styled-components 6 + xstyled 4                     |
| **Routing**         | React Router 8                                      |
| **i18n**            | i18next (French and English)                        |
| **Tests**           | Vitest 4 + Testing Library, Playwright 1 (Chromium) |
| **Package Manager** | pnpm                                                |

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

**Ports**: `pnpm dev` listens on 3000 and `pnpm preview` on Vite's default port, 4173, unless a `PORT` variable is set, in the environment or in `.env.local`. Then both use it, and so does the preview server of `pnpm test:browser`. Each Worktrunk worktree gets its own: when the worktree is created, `.config/wt.toml` writes `PORT=<port>` to its `.env.local` (gitignored), a port between 10000 and 19999 derived from the branch name, so it stays the same for the branch and several worktrees can serve the app at the same time. Read the port of a worktree in its `.env.local`, or override it for one run with `PORT=4000 pnpm dev`. An empty or invalid `PORT` is ignored (`vite/utils.ts`). When the port is taken, `pnpm dev` and `pnpm preview` stop with an error instead of moving to another port (`strictPort`), so a test never reaches the server of another worktree by mistake: stop the server that holds the port, or pick another one with `PORT`.

### Production

```bash
pnpm build     # Type-check, then build to dist/
pnpm build:standalone   # Type-check, then build the site that opens from the disk to dist-standalone/ (see Releases)
pnpm size      # Check the size of dist/ (run it after pnpm build)
pnpm preview   # Serve the production build locally
pnpm smoke-test https://issoufi.fr   # Check that a deployed site serves the pages of dist/
```

`pnpm size` fails when the scripts and style sheets that the home page loads before it renders (those that `dist/index.html` references with `<script src>`, `modulepreload` or `stylesheet`) exceed 150 kB gzip, or when those of the whole build, every chunk included, exceed 210 kB gzip. It also fails when `dist/index.html` references none, and warns about images over 500 kB. These limits are in `scripts/ci/constants.mjs`.

`pnpm smoke-test <site URL>` requests every page of `dist/` on the site, plus an unknown path, and fails unless each answers with the expected status (200, or 404 for the unknown path) and the title and canonical URL of the build. It retries for about 20 seconds while a new deployment spreads, and fails at once when `dist/` is missing or holds no HTML page.

### Link preview image

```bash
pnpm exec playwright install --only-shell chromium   # Once, and after a Playwright update
pnpm og-image        # Regenerate public/og-image.jpg
```

`public/og-image.jpg` is the 1200×630 image that link previews show for every page (`og:image` in `index.html`). `pnpm og-image` (`scripts/og-image/generate-og-image.mjs`) regenerates it from the repository alone: the French texts of the home page (`src/i18n/fr.ts`), the design tokens (`src/theme/theme.ts`), the background photo and the particle field of the home page, and the domain of `SITE_URL` (`src/utils/pages.ts`), which it reads through Vite. Chromium, from Playwright, renders the page that the script builds in the Google Fonts of `index.html`, so the script needs the network, and it stops when a text, a design token or a particle setting is missing, or when a font does not load in one of the weights the page uses. The screenshot is saved as a JPEG of quality 90 (`OG_IMAGE_JPEG_QUALITY`), about 100 kB where a PNG of the same image weighs 470 kB, and the script fails rather than write an image over 300 kB, above which WhatsApp shows no image. The particles are drawn from a fixed seed (`PARTICLE_SEED`), so two runs on the same machine write the same file. The sizes and spacing of the layout are in `scripts/og-image/constants.mjs`.

Run it after changing the texts, the background photo, the colors or the fonts of the home page, look at the image, then commit it with the change: it runs on demand, not in the build or the CI.

### Tests

```bash
pnpm test            # Single run
pnpm test:watch      # Watch mode
pnpm test:coverage   # Single run with coverage, HTML report in coverage/index.html
```

Tests are `*.spec.jsx` (components), `*.spec.ts` (helpers and hooks, those of `e2e/` included) and `*.spec.js` (helpers of the scripts of `scripts/` and the test helpers of `src/styleTestUtils.js`, `src/pages/testUtils.js`, `src/App/testUtils.js` and `src/theme/testUtils.js`) files next to the code they test. Every component has one. `vite.config.spec.ts` builds the site in memory, with the real config, and checks the generated pages, and `vite.standalone.config.spec.ts` does the same for the standalone build (see Releases). `src/setupTests.ts` renders every component in the theme and global styles of the app (`src/testUtils.tsx`), so the styles hold the values of the tokens, gives no canvas context, as jsdom has none, and fails a test that logs an error with `console.error`, such as a React warning, so the output stays clean. As in production, styled-components inserts its rules into the CSSOM (`SC_DISABLE_SPEEDY` in `vite.config.ts`), which keeps jsdom from parsing a whole `<style>` again on every change, and `src/setupTests.ts` fails a test whose component inserts a rule that browsers would drop, such as one holding the source of a function interpolated outside a `css` block. The tests read the declared styles through the CSSOM (`listStyleRules`, `declaredStyle` and `serializeCssValue` of `src/styleTestUtils.js`), since jsdom ignores media queries and pseudo-elements. `pnpm test:coverage` fails when the coverage of `src/`, of the Vite config helpers (`vite/`), of the browser test helpers (`e2e/`) and of the script helpers (`scripts/ci/utils/` and `scripts/og-image/utils/`) drops below the thresholds of `vite.config.ts` (`COVERAGE_THRESHOLDS_PERCENT`).

### Browser tests

```bash
pnpm exec playwright install --only-shell chromium   # Once, and after a Playwright update
pnpm build
pnpm test:browser    # Check in Chromium that no page of the build scrolls sideways, and that the timeline dots sit on its line
```

jsdom computes no layout, so the browser tests run in a real browser with [Playwright](https://playwright.dev/): the `*.e2e.ts` files of `e2e/`, configured by `playwright.config.ts`. They test the production build: `pnpm test:browser` serves `dist/` with `pnpm preview` on the port of the worktree (see Ports), with `--strictPort`, and never reuses a server already on that port, so run `pnpm build` first. `e2e/horizontal-overflow.e2e.ts` opens every route of `PAGES` (`src/utils/pages.ts`), so a new page is covered without changing it, and an unknown path for the not found page, in each language of `LANGUAGES` (`src/i18n/constants.ts`), stored in `localStorage` as the language toggle does, on screens 320, 375, 414 and 1440 px wide (`e2e/constants.ts`). A page fails when it is wider than the screen (`document.documentElement.scrollWidth` above its `clientWidth`), and its screenshot is saved in `test-results/`.

`e2e/timeline.e2e.ts` checks, in the same languages and at the same widths, that the dots of the Experiences timeline sit on its line: the mobile layout draws a dot for each company and each later role, the desktop layout one in each period column. The line and the dots are `::before` and `::after` pseudo-elements placed by hand, whose offset depends on the size, the border and the `box-sizing` of the dots, and the DOM gives no box for a pseudo-element. The test measures them through the DevTools protocol (`DOM.getBoxModel`, CSS transforms included, `e2e/pseudo-elements.ts`), and fails when the center of a dot is more than 0.5 px from the center of the line (`MAX_DOT_OFFSET_PX`), when it finds no dot, or when it does not find exactly one line. It finds them by stable attributes rather than by the DOM structure: `data-timeline-line` on the timeline and `data-timeline-dot` on each element that draws a dot, whose value names the pseudo-element that draws it (`before` or `after`). When a line or a dot moves to the other pseudo-element, change its attribute with it.

Playwright is a dev dependency, but its browsers are downloaded apart from `node_modules`, to a cache shared by every project of the machine (`~/Library/Caches/ms-playwright` on macOS, `~/.cache/ms-playwright` on Linux): the command above installs only the headless shell of Chromium, which is enough to load, measure and screenshot pages. Each Playwright version needs its own browser build, so run it again after a Playwright update; `pnpm test:browser` says so when the browser is missing.

### Checks

```bash
pnpm typecheck      # Type-check src/, vite/, e2e/, the configs and their specs, then the scripts of scripts/, without building
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

- **One HTML file per page**: at build time, a Vite plugin (`vite.config.ts`) fills the `%PAGE_*%` placeholders of `index.html` and emits `projects.html` and `experiences.html` from the same template. Each page gets its own title, description and canonical URL, taken from the `meta` translations of `src/i18n/fr.ts`, so link previews and search engines get them without running JavaScript. Every page shares the same link preview image, `public/og-image.jpg` (1200×630, under 300 kB, checked by `src/utils/pages.spec.ts`), generated from the home hero by `pnpm og-image` (see Link preview image): regenerate it when the hero changes. Its description, `og:image:alt`, is the `meta.ogImageAlt` translation, filled in like the title. Cloudflare Pages serves these files at `/projects` and `/experiences`. A new route needs an entry in `PAGES` (`src/utils/pages.ts`), with the `folder` of its page in `src/pages`.
- **Language**: the generated pages are in French, the language of a first visit. The FR / EN toggle stores the visitor's choice in `localStorage` (`language` key, `src/i18n/storage.ts`), and the app reads it before its first render, so a reload or a later visit opens in that language, with the title, `lang` attribute and description to match. When the browser blocks the storage, the site opens in French, and a language chosen with the toggle only lasts until the next reload.
- **Translations**: `src/i18n/fr.ts` holds the French texts, the default and fallback language, and `en.ts` the English ones, under the same keys: add every new text to both files. `en` is typed with `Translations` (`src/i18n/types.ts`), the keys of `fr` with texts of their own, so `pnpm typecheck` names a key missing from either file, and so does `src/i18n/en.spec.ts` in `pnpm test`. Without them, a key forgotten in English would silently show its French text on the English site.
- **Not found pages**: the plugin also emits `404.html`, with the "page not found" title and a `noindex` tag. Cloudflare Pages serves it with a real `404` status for any path that matches no file. The URL is kept, with no redirect, and the app shows its NotFound page. Because `404.html` exists, Cloudflare's single-page-app fallback is off, which is why every route needs its own HTML file.
- **Code splitting**: the home page is in the main chunk, and every other page (`Projects`, `Experiences`, `NotFound`) is loaded with `React.lazy` on its first visit, from its own chunk named after its folder (`vite.config.ts`). The header stays on screen while a page loads. The burger icon loads the light build of `lottie-web` (SVG only) after the first render, so the animation never delays a page. Each deployment replaces the chunks of the previous one: a page opened before a deployment reloads once when it cannot load a chunk any more (`useReloadOnStaleChunk`, `src/App/hooks`), at most once a minute so a missing chunk never causes a loop. Meanwhile, the page it was loading stays blank below the header instead of failing (`keepPendingWhileReloading`, `src/App/utils.ts`). Import a lazily loaded page from its folder only, never through a shared barrel, which would put it back in the main chunk.
- **Preloading the page chunk**: each generated page, `404.html` included, has a `modulepreload` link to the chunk of the page it shows, the chunk built from the `index.ts` of its `folder` (`getPageChunkFile`, `vite/utils.ts`). On a direct visit, the browser downloads it at the same time as the main chunk, instead of once the main chunk has run. The home page is in the main chunk and gets none. `vite.config.spec.ts` checks that each page preloads its own chunk and no other.
- **Errors**: a page that throws while rendering, or whose chunk still fails to load after that reload, is replaced below the header by a translated message with a reload button (`RouteErrorBoundary`, `src/App`), instead of a blank page. The header stays usable, and going to another page renders the routes again. React logs the error to the console; nothing is reported anywhere else.
- **Focus after a navigation**: once a link is followed, the first `h1` of the new page takes the keyboard focus (`PageHeadingFocus`, `src/App`), so keyboard and screen reader users start on the page they chose instead of on the body. Give every page an `h1`. It gets `tabindex="-1"`, so it stays out of the `Tab` order, and no focus ring. The first load and the browser's back and forward buttons leave the focus to the browser.
- **Years of experience**: the number in the generated HTML files is computed at build time from `CAREER_START_DATE` (`src/utils/career.ts`), so it only changes with a new build. The workflow `.github/workflows/rebuild.yml` runs the CI on `main` on the first day of every month, which rebuilds and redeploys production, so the number is right from June 1st, the career anniversary. GitHub disables scheduled workflows after 60 days without activity on the repository: if that happens, re-enable it from the Actions tab. The app itself computes the number at runtime.
- **Continuous integration**: the GitHub Actions workflow `.github/workflows/ci.yml` checks the formatting, lints, type-checks, tests and builds every push to `main` and `develop` and every pull request. The test job measures the coverage, adds its total to the job summary and keeps the HTML report as the `coverage` artifact for 14 days. The build job runs `pnpm size`, which adds the size of each script, of the initial load of the home page and of the whole build to the job summary, and annotates the images to compress. The scripts behind these summaries live in `scripts/ci/`. The browser test job then runs `pnpm test:browser` (see Browser tests) on the `dist` artifact of the build: it caches the headless shell of Chromium for each Playwright version, installs the system libraries it needs on every run, and keeps the screenshots of the failed pages as the `browser-test-results` artifact for 14 days. On pull requests, it also checks the commit messages with commitlint (except Dependabot's) and runs GitHub's dependency review, which fails when a change brings in a dependency with a known vulnerability. The jobs that need the dependencies (format, lint, type-check, test, commit messages, build and browser test) install pnpm, Node.js and the dependencies with the composite action `.github/actions/setup`, which reads the versions from `package.json` and `.nvmrc` and caches the pnpm store. The other jobs (dependency review, credentials check, deployment and smoke test) do without. When everything passes, the browser test included, it deploys the build (see above).
- **Dependency updates**: Dependabot (`.github/dependabot.yml`) opens weekly pull requests against `develop`: one for all minor and patch npm updates, one per major version, and one for the GitHub Actions. A release is only proposed once it is 7 days old, and pnpm applies the same rule to every install (`minimumReleaseAge` in `pnpm-workspace.yaml`), so a version published days ago never reaches the lockfile. Security updates target the default branch, `develop`, too.
- **Former address**: `https://aissoufi.github.io` is served by the [AIssoufi/AIssoufi.github.io](https://github.com/AIssoufi/AIssoufi.github.io) repository, which redirects every path to the same path on `https://issoufi.fr`.

## 🏷 Releases

[`CHANGELOG.md`](CHANGELOG.md) is written by [release-please](https://github.com/googleapis/release-please) from the Conventional Commits, never by hand:

1. Each push to `develop` updates a release pull request against `develop` (_chore: release x.y.z_), with the next version in `package.json` and the new `CHANGELOG.md` entry. The workflow `.github/workflows/release.yml` maintains it. GitHub Actions opens it, so GitHub may hold its CI like a first-time contributor's: click _Approve workflows to run_ on the pull request, since its checks are required to merge it.
2. Merging it tags the version (`vX.Y.Z`) and publishes a GitHub release. GitHub attaches the source code to it (zip and tar.gz), and the `standalone-build` job of the same workflow attaches `issoufi.fr-vX.Y.Z.zip`, the standalone build below.
3. A pull request from `develop` to `main` then puts the release in production.

The version follows the commits: `fix` bumps the patch version, `feat` the minor version, and a breaking change (`feat!:` or a `BREAKING CHANGE:` footer) the major version. The changelog lists features, fixes, performance improvements, reverts, refactors and documentation; `build`, `ci`, `test`, `style` and `chore` commits stay out of it (`release-please-config.json`). It starts with the React 19 and Vite rewrite of March 2026.

### Standalone build

`issoufi.fr-vX.Y.Z.zip` holds one folder, `issoufi.fr-vX.Y.Z/`, with the site as it was at that version: a visitor unzips it and opens `index.html` with a double click, with no server, no Node.js and nothing to install, every page and the language toggle included. Its `README.txt` (`vite/standalone/README.txt`) says so in French and in English. The site requests nothing from issoufi.fr; only the fonts come from Google Fonts, and the browser shows its own offline.

The production build cannot open from the disk: its URLs are absolute (`/assets/…`), which point to the root of the disk under `file://`, `BrowserRouter` would read the path of the file as the route and show the not found page everywhere, and browsers refuse to load module scripts, such as the chunks of the lazily loaded pages, from `file://`. `pnpm build:standalone` therefore builds it again with `vite.standalone.config.ts`, which takes the config of `vite.config.ts` as it is and adds four plugins:

- `vite-plugin-singlefile` inlines the whole app, the pages loaded lazily and `lottie-web` included, in `index.html` (about 620 kB, 193 kB gzip; zipped with the files of `public/`, 2.3 MB, mostly the CV), with a relative base;
- `standalone-hash-router` resolves the imports of `react-router` from `src/` to `vite/standalone/react-router.ts`, whose `BrowserRouter` is the `HashRouter`, so the routes read the hash of the URL (`index.html#/projects`);
- `standalone-relative-public-urls` turns the URLs of the files of `public/` that the code writes as strings (`'/home.webp'`, the `imageUrl` of the projects, the CV) into URLs relative to the page (`'./home.webp'`), since Vite copies these files next to `index.html`. Write such a URL as one whole string, never built from parts (`'/' + name`), or the standalone build will not find the file;
- `standalone-page` removes the other pages (`projects.html`, `experiences.html`, `404.html`), which only a web server needs, and adds the `README.txt`.

The production build and its deployment do not change: neither `vite.config.ts` nor the code of the app knows about the standalone build. `vite.standalone.config.spec.ts` builds it in memory and checks that `index.html` is its only page and loads no script from a file, that the app imports the hash router, that no URL of a file of `public/` is absolute and that the `README.txt` is there; the helpers are in `vite/standalone/utils.ts`, with their spec. To try it, run `pnpm build:standalone` and open `dist-standalone/index.html` in a browser.

The job runs only when release-please has just created a release (its `release_created` output), checks out the tagged commit, runs `pnpm build:standalone`, zips `dist-standalone/` under the name of the archive and uploads it with `gh release upload` (`--clobber`, so running the job again replaces it). The release workflow needs no other secret than its own token, which may write the contents of the repository.

## 📁 Project Structure

```
.
├── .config/
│   └── wt.toml           # Worktrunk: installs the dependencies and writes the port of each worktree
├── .github/
│   ├── actions/setup/    # Composite action: pnpm, Node.js and the dependencies, with a cache
│   ├── workflows/        # ci.yml (checks, build, browser test, deployment, smoke test), release.yml (release pull request, standalone build of each release), rebuild.yml
│   └── dependabot.yml    # Weekly dependency updates against develop
├── .husky/               # Git hooks: lint-staged before a commit, commitlint on its message
├── e2e/                  # Browser tests (*.e2e.ts) run by Playwright on the build, their helpers and constants
├── public/               # Images, link preview image, CV, favicon, manifest and robots.txt, copied as is to dist/ and dist-standalone/
├── scripts/
│   ├── ci/               # CI scripts: bundle size, coverage summary, smoke test
│   │   ├── utils/        # Their helpers, one file per topic, each with its spec
│   │   └── constants.mjs # Budgets, file patterns and smoke test settings
│   ├── og-image/         # pnpm og-image: renders public/og-image.jpg from the home page
│   │   ├── utils/        # Its helpers (texts, template, particles, fonts, HTML, seeded random), each with its spec
│   │   └── constants.mjs # Size, weight limit, JPEG quality, sources and layout of the image
│   └── tsconfig.json     # Type-checks the scripts, run by pnpm typecheck
├── src/
│   ├── App/              # Root component, router, layout and the lazy loading of the pages
│   │   ├── DocumentMeta/ # <html lang>, title and description per route and language
│   │   ├── hooks/        # useReloadOnStaleChunk: reloads once when a deployment removed a chunk
│   │   ├── PageHeadingFocus/ # Gives the keyboard focus to the h1 of the new page after a link
│   │   ├── RouteErrorBoundary/ # Error message with a reload button in place of a page that fails
│   │   ├── Header/       # Logo, navigation, burger menu and LangToggle/ (FR / EN switch)
│   │   └── testUtils.js  # waitForBurgerIcon, shared by the specs that render the burger menu
│   ├── components/       # Components shared across pages
│   │   ├── List/         # <ul role="list"> of every list, extended with styled(List)
│   │   ├── Page/         # <main> landmark of every page, extended with styled(Page)
│   │   └── StatusMessage/ # Code, title, message, action button and home link of error pages
│   ├── i18n/             # French and English translations, and the storage of the chosen language
│   ├── pages/
│   │   ├── Home/         # Landing page: animated title, particle background, hooks/ for effects
│   │   ├── Projects/     # Personal and freelance projects, data in .data/*.json
│   │   ├── Experiences/  # Work experience timeline
│   │   ├── NotFound/     # 404 page, shown at the requested URL
│   │   ├── Forbidden/    # 403 page, not routed yet
│   │   └── testUtils.js  # Helpers shared by the page tests, e.g. isPublicFile
│   ├── theme/            # Design tokens (primitives in tokens.ts, roles in theme.ts) and global styles
│   │   └── testUtils.js  # Raw-value guards that the theme spec runs on the style files and theme.ts
│   ├── utils/            # Career dates and page metadata helpers
│   ├── cssRuleGuard.ts   # logDroppedCssRules: fails a test whose component inserts a CSS rule that browsers drop
│   ├── index.tsx         # Entry point
│   ├── setupTests.ts     # Test setup: theme around every render, no canvas, fails on console.error
│   ├── styleTestUtils.js # listStyleRules, declaredStyle, serializeCssValue: the declared styles, read through the CSSOM
│   ├── testErrors.ts     # describeLoggedErrors: the failure message of a test that logs an error
│   └── testUtils.tsx     # withTheme: the theme and global styles wrapper of the tests
├── vite/                 # Helpers of vite.config.ts and playwright.config.ts: dev and preview ports, chunk names, page chunks
│   └── standalone/       # Helpers, router module and README.txt of the standalone build (vite.standalone.config.ts)
├── index.html            # HTML template of every page, filled at build time by vite.config.ts
├── playwright.config.ts  # Playwright: Chromium, on pnpm preview at the port of the worktree
├── vite.config.ts        # Vite, the plugin that writes one HTML file per page, Vitest and coverage
├── vite.config.spec.ts   # Builds the site in memory and checks the generated pages
├── vite.standalone.config.ts      # pnpm build:standalone: the production config, plus the plugins that let it open from the disk
└── vite.standalone.config.spec.ts # Builds the standalone site in memory and checks it
```

## 📝 Conventions

- **Branches**: `main` is production and `develop`, the default branch, the integration branch. A ruleset protects both: changes go through a pull request whose CI checks pass, and force pushes and deletions are refused. The `production` environment only accepts deployments from `main`. Each ticket is worked on in its own [Worktrunk](https://worktrunk.dev) worktree next to the repository (`AIssoufi.github.io.ISF-35`), on a branch named after its reference: the `ISF-` autolink turns `ISF-35` into a link to issue #35. The branch starts from `develop` (`wt switch --create ISF-35 --base develop`) and goes back into it through a pull request that says `Closes #35`, once the CI passes. `.config/wt.toml` installs the dependencies of each new worktree and writes its port to `.env.local` (see Development). A release is a pull request from `develop` to `main`.
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) enforced via commitlint. They also set the next version and the changelog (see Releases).
- **Linting**: ESLint (`eslint.config.js`) with the recommended rules of ESLint and typescript-eslint, React Hooks (including the React Compiler rules) and React Refresh. It also forbids importing `styled-components` directly, importing the style file of a component (`Name.styled`) from outside its folder, and rendering a `ul` other than through `List`.
- **Formatting**: Prettier (via lint-staged + husky)
- **Language**: code, comments and docs are in English. Only user-facing texts are translated.
- **Styles**: styled-components read every color, spacing, size, font, radius, shadow, duration, easing and breakpoint from the design tokens of `src/theme` with the [xstyled](https://xstyled.dev/) `th` helpers (`th.color('accent')`, `th.space(16)`, `th.size(36)`, `th.radius('md')`…), and keyframes from the `theme` object. No hard-coded values: `src/theme/theme.spec.jsx` fails on a length in pixels, a duration, a color or an easing written by hand in a style file, and allows only zero, percentages, viewport units, angles and unitless numbers. The semantic tokens of `theme.ts` only read the primitive scales of `tokens.ts`, or build alpha variants from them, and the same spec fails on a value written by hand there. Every styled-components API is imported from `@xstyled/styled-components`.
- **Components**: one folder per component (`Name.tsx`, `Name.spec.jsx`, `Name.styled.ts`, `index.ts`), styles imported only by their own component, optional props that tolerate missing values, and JSDoc on every component and prop. See [`CLAUDE.md`](CLAUDE.md) for the details.
- **Accessibility**: every page renders a single `<main>` landmark, its `Page` component, and a single `h1`, visually hidden when the design shows none; its sections use `h2` and below. The test of each page checks both. Every list is a `List` (`src/components/List`): the global style removes the bullets of lists, and Safari then stops exposing a `ul` as a list, which `role="list"` restores, so VoiceOver still announces it and counts its items.
