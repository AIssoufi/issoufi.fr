# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server on port 3000, or on PORT (.env.local in a worktree)
pnpm build        # Type-check + production build (tsc && vite build)
pnpm size         # After a build: fails over the gzip budget of scripts/ci/constants.mjs
pnpm smoke-test <url> # After a build: checks that a deployed site serves the pages of dist/
pnpm preview      # Preview production build on port 4173, or on PORT
pnpm typecheck    # Type-check only: src/, vite/ and vite.config.ts, then scripts/ (scripts/tsconfig.json)
pnpm lint         # ESLint (eslint.config.js)
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage; fails below COVERAGE_THRESHOLDS_PERCENT (vite.config.ts)
pnpm format:check # Check Prettier formatting, as the CI does
pnpm format       # Format every file with Prettier
```

ESLint uses the recommended rules of ESLint, typescript-eslint, React Hooks (with the React Compiler rules) and React Refresh. Formatting is handled automatically by Prettier via lint-staged on commit.

## Architecture

Personal portfolio SPA built with React 19 + TypeScript + Vite.

**Entry point**: `src/index.tsx` mounts to the `#welcome` DOM element.

**Routing** (`src/App/App.tsx`): flat BrowserRouter setup with three routes — `/` (Home), `/projects`, `/experiences` — and a `*` catch-all rendering the NotFound page at the requested URL, without redirecting. Home is in the main chunk; the other pages are loaded with `React.lazy` on their first visit, each from its own chunk, so import them from their own folder (`../pages/Projects`), never through a barrel that would put them back in the main chunk. A Forbidden page (403) exists for content the visitor may not access. Each route also needs an entry in `PAGES` (`src/utils/pages.ts`), which drives its metadata and the HTML file generated for it at build time. This is required: the build also emits a `404.html`, which turns off Cloudflare's single-page-app fallback, so a route without its own HTML file would return a 404 on reload.

**Component conventions**: every component lives in its own folder named after it:

- `ComponentName.tsx` — the component, with JSDoc on the component and on every prop
- `ComponentName.spec.jsx` — its tests, **required** for every component, at least a render without props
- `ComponentName.styled.ts` — styled-components styles, when it has any (not documented with JSDoc)
- `index.ts` — re-export

Sub-components get the same structure in their own folder inside their parent's folder. A component shared by several sub-components of a parent sits at the root of that parent's folder. Components shared across pages live in `src/components/` (e.g. `StatusMessage`). Props are optional by default, and components must render without crashing when a prop is missing.

**Styling and design tokens**: `src/theme/tokens.ts` holds the primitive scales (palette, spacing, font sizes…) and `src/theme/theme.ts` the semantic tokens, following the xstyled theme conventions (`colors` with `-aNN` alpha variants, `space`, `fontSizes`, `radii`, `shadows`, `zIndices`, `durations`, `timingFunctions`, `screens`…). Import `styled`, `css`, `keyframes`, `createGlobalStyle`, `ThemeProvider` and `th` from `@xstyled/styled-components` only, never from `styled-components` directly (ESLint and a test enforce it). Styled-components read the tokens with the `th` helpers (`th.color('accent-a55')`, `th.space(16)`, `th.radius('md')`, `th('screens.tablet')`); color names are type-checked, and `src/theme/theme.spec.jsx` checks that every token used in a style file exists. JavaScript code (canvas, inline styles) imports `theme` directly. `App` provides the `ThemeProvider` and `GlobalStyle` (which replaced `index.css`). Never write a raw color, spacing, font size, radius, shadow, duration, z-index or breakpoint in a style file: look for an existing token first, then add one to the right scale.

**Logic, constants and hooks**: magic numbers are named constants with their unit (`constants.ts` next to their users), computations are pure helpers in `utils.ts` with tests, and stateful effects are hooks in `hooks/useThing/` with tests (see `src/pages/Home/hooks`).

**Static data**: page-level data lives in `.data/*.json` files inside the page directory (e.g. `src/pages/Projects/.data/freelance-projects.json`).

**Assets**:

- Background images are served from `public/` and referenced with absolute paths (e.g. `'/projects.jpeg'`)
- SVGs are imported as React components via `vite-plugin-svgr`
- Lottie animations use JSON files co-located with the component

**Tests**: Vitest + Testing Library. Test files are co-located with the code they test: `*.spec.jsx` for components, `*.spec.ts` for helpers and hooks, `*.spec.js` for the CI helpers of `scripts/ci/utils/`. Setup file at `src/setupTests.ts` extends Vitest with `@testing-library/jest-dom`. Components that need routing must be wrapped with `<BrowserRouter>` in tests.

**CI and deployment**: `.github/workflows/ci.yml` checks formatting, lint, types (`src/` and `scripts/`), tests with coverage thresholds and the bundle size, builds, then deploys the `dist` artifact to Cloudflare Pages (project `issoufi-fr`) with Wrangler and smoke-tests it: `main` goes to production at issoufi.fr, any other branch to a preview. On pull requests, it also checks the commit messages with commitlint (except Dependabot's) and runs GitHub's dependency review. Cloudflare's own automatic builds are paused. `.github/workflows/rebuild.yml` reruns the CI on `main` on the first day of every month, so the years of experience written in the HTML files stay right, and `release.yml` maintains the release-please pull request. The helpers of the CI scripts are in `scripts/ci/utils/`, one file per topic (`bundle.mjs`, `coverage.mjs`, `pages.mjs`, `job-summary.mjs`, `lists.mjs`, `numbers.mjs`), each with its tests.

## Conventions

- **Branches**: `main` is production, `develop` the integration and default branch. A ruleset refuses direct pushes to both: every change goes through a pull request with passing checks. Work on each ticket in its own Worktrunk worktree, on a branch named after the ticket reference (`ISF-35`, from the `ISF-` autolink to the issues). Start it with the `ticket-worktree` skill (`ticket.mjs start ISF-35`), which fetches `develop` and branches from `origin/develop`, rather than with a bare `wt switch --create`. Open its pull request against `develop` with `Closes #35`. Only release pull requests from `develop` target `main`.
- **Ports**: when a worktree is created, `.config/wt.toml` writes `PORT=<port>` to its `.env.local`, a port derived from the branch (10000–19999). `vite.config.ts` reads it with `getServerPorts` (`vite/utils.ts`) for both `pnpm dev` and `pnpm preview`, so read a worktree's port in its `.env.local` rather than assuming 3000. Without `PORT`, as in the main checkout, they use 3000 and 4173. A taken port stops the server with an error (`strictPort`) instead of moving it to another port, and `BROWSER=none` stops Vite from opening the browser.
- **Commits**: Conventional Commits enforced via commitlint + husky (`feat:`, `fix:`, `refactor:`, etc.). They set the next version and `CHANGELOG.md`, which release-please writes: never edit the changelog by hand, and use `feat`/`fix` only for changes a visitor of the site would notice, since those appear in it.
- **Formatting and linting**: on commit, lint-staged runs `eslint --fix` then Prettier on staged files, one after the other (`--concurrent false`, as both write the same files). A lint error stops the commit.
