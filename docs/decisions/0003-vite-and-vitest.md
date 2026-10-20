# 0003. Build with Vite and test with Vitest

- Date: 2026-03-21
- Status: Accepted

## Context

From its first commit, the app was built, served and tested by Create React App: `react-scripts` 5.0.1 since [0001](0001-typescript.md), which runs webpack 5, Babel and Jest behind a configuration that the project cannot change without ejecting. On 2025-02-14 the React team deprecated Create React App for new apps and stopped its active development ([Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)).

## Decision

Commit `47379f5`, pushed to the default branch with no pull request, on 2026-03-21:

- Vite 6 with `@vitejs/plugin-react` and `vite-plugin-svgr` replaces `react-scripts`. `index.html` moves from `public/` to the root, where Vite reads it, and `vite.config.ts` sets the plugins and the port of the dev server, 3000 as before.
- The `build` script becomes `tsc && vite build`: Vite strips the types without checking them, so the type-check is its own step.
- Vitest 3 with jsdom replaces Jest, and `@testing-library/jest-dom/vitest` the Jest setup.
- React and React DOM move from 18 to 19, React Router from 5 to 7, TypeScript from 4.9 to 5.7, and Testing Library to its versions for React 19.

## Alternatives considered

The commit records no alternative. The ones open then:

- **Keep Create React App, or eject it**: a deprecated tool, or its whole webpack and Babel configuration to maintain in the repository.
- **A React framework such as Next.js**, among the paths that the React team advised: a new routing model and a server or a static export step, for a site of four pages that a static host serves.
- **Another bundler, such as Parcel or Rsbuild**: the tests move to Vitest, which reuses the config and the plugins of Vite; with another bundler, the tests need a config of their own.

## Consequences

Measured on 2026-10-20 in a detached worktree of each commit, with Node.js 20.13.1 and `npm ci`. The build time is the median of three runs of `npm run build`, with no build cache (`node_modules/.cache`, `build/` and `dist/` deleted before each run); both include the type-check. Sizes are the sums of the JavaScript and CSS files of the build, gzipped. The advisories are those that `npm audit` reports on 2026-10-20.

| Figure                         | Before (`6674b92`, Create React App) | After (`47379f5`, Vite) |
| ------------------------------ | ------------------------------------ | ----------------------- |
| Build time                     | 5.92 s                               | 2.77 s                  |
| JavaScript, gzip               | 147.9 kB                             | 175.1 kB                |
| CSS, gzip                      | 4.4 kB                               | 3.1 kB                  |
| Unit tests that pass           | 1 of 1                               | 0: the suite fails      |
| Direct dependencies (dev)      | 24 (16)                              | 25 (19)                 |
| `npm audit` advisories in 2026 | 101, of which 4 critical             | 27, of which 2 critical |

- The build takes half the time. The dev server serves the source files as ES modules, with no bundle to build first.
- The JavaScript grows by 27.2 kB gzipped, with React 19 and React Router 7, which the same commit brings.
- The one test of the time fails under Vitest with `describe is not defined`: Jest declares its functions as globals, Vitest does not by default. Commit `7c9a3af`, on 2026-03-25, turns on the globals of Vitest and brings the suite to 22 passing tests.
- The config of Vite is the one place where the build, the dev server and the tests are set, which later steps extend: the pages written at build time ([0008](0008-html-file-per-route.md), [0015](0015-render-at-build-time.md)) are Vite plugins.
