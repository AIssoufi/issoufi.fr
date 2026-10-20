# 0001. Write the app in TypeScript

- Date: 2024-02-16
- Status: Accepted

## Context

The first commit, `4ee7e5c` on 2021-01-29, holds a Create React App 4.0.1 app in JavaScript, with React 17 and React Router 5. On 2024-02-16, before this decision, `src/` held 28 JavaScript files, one of them a test, and nothing checked the props given to a component or the shape of the data files of the projects and the experiences.

## Decision

Two commits pushed to the default branch, with no pull request:

- `3cbb26b` upgrades React from 17 to 18 and Create React App from 4.0.1 to 5.0.1, installs TypeScript 4.9.5 with the types of React, React Router, Jest and Node.js, and adds `tsconfig.json` with `strict` on.
- `3a50780` renames the files of `src/` to `.ts` and `.tsx`: 29 TypeScript files, and one JavaScript test left.

Create React App type-checks the TypeScript files during `npm start` and `npm run build`, so the change needed no other tool.

## Alternatives considered

The commits record no alternative. The ones open then:

- **JavaScript with JSDoc types**, checked by `tsc` with `checkJs`: no new syntax, but each type lives in a comment, and Create React App does not run that check during the build.
- **Flow**: Create React App supports it too, but the types of React and React Router that `3cbb26b` installs, the `@types/*` packages, are TypeScript ones.

## Consequences

Measured on 2026-10-20 in a detached worktree of each commit, with Node.js 16.20.2 and `npm ci`. The build time is the median of three runs of `npm run build`, after deleting `node_modules/.cache` and `build/`. Sizes are the sums of the JavaScript and CSS files of `build/`, gzipped with `gzip -c <file> | wc -c`. The advisories are those that `npm audit` reports on 2026-10-20 for the lockfile of the commit, not those known at the time.

| Figure                         | Before (`0848698`)        | After (`3a50780`)       |
| ------------------------------ | ------------------------- | ----------------------- |
| Build time                     | 6.15 s                    | 6.53 s                  |
| JavaScript, gzip               | 125.2 kB                  | 137.0 kB                |
| CSS, gzip                      | 3.3 kB                    | 3.2 kB                  |
| Unit tests                     | 1                         | 1                       |
| Direct dependencies (dev)      | 10 (4)                    | 17 (10)                 |
| `npm audit` advisories in 2026 | 212, of which 22 critical | 99, of which 4 critical |

- The type-check runs in every build, so a wrong prop or a wrong field of a data file stops it.
- The JavaScript grows by 11.8 kB gzipped. The build removes the types, so the growth comes from the code and the packages that changed, React 18 and Create React App 5 among them. Their share is not measured: `3cbb26b` alone does not build, since it replaces `jsconfig.json` and its `baseUrl` with a `tsconfig.json` without one, and its code still imports `shared-components/Modal` from that base, which `3a50780` then removes.
- The upgrade of Create React App removes over half of the advisories that its old dependencies carry today.
