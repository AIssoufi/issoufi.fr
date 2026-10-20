# 0007. Deploy to GitHub Pages from GitHub Actions

- Date: 2026-03-25
- Status: Superseded by [0009](0009-cloudflare-pages.md)

## Context

Until 2026-03-25, the repository held no deployment: no workflow, no config of a host, and no step that built the site and put it online. Nothing checked a commit before it reached the public site either, since the repository had no CI.

## Decision

Commits pushed to the default branch with no pull request, on 2026-03-25:

- `ead267a` adds `.github/workflows/deploy.yml`: on each push to `main`, it builds the site with pnpm and deploys `dist/` to GitHub Pages with `actions/upload-pages-artifact` and `actions/deploy-pages`. `3b39551` sets the `base` of Vite to `/`, for the root of `https://aissoufi.github.io/`.
- `d1d0877`, `bfdc347` and `cfa4239` move the workflow to Node.js 24.
- `8b1d3c6` adds a `typecheck` and a `test` job, which the build waits for: a commit whose types or tests fail is not deployed.

## Alternatives considered

The commits record no alternative. The ones open then:

- **Firebase Hosting**, in the project that served the images until [0006](0006-assets-in-public.md): a host and a token outside GitHub, for a site whose code and CI are on GitHub.
- **A host with its own builds, such as Netlify, Vercel or Cloudflare Pages**: it builds each push itself, outside the checks of the repository. The site moves to Cloudflare Pages on 2026-10-17 ([0009](0009-cloudflare-pages.md)), deployed from GitHub Actions after the checks.

## Consequences

Read on 2026-10-20 with `gh api 'repos/AIssoufi/issoufi.fr/actions/runs?branch=main'`: the runs of the _Deploy to GitHub Pages_ workflow, from its creation to the last one on 2026-10-17, timed from the creation of each run to its last update.

| Figure                          | Before | After                                             |
| ------------------------------- | ------ | ------------------------------------------------- |
| Deployment from the repository  | none   | each push to `main`                               |
| Runs of the workflow            |        | 17: 11 deployed, 6 failed                         |
| Duration of a run that deployed |        | median 57 s, from 34 s to 5 min 1 s, over 11 runs |
| Checks before the deploy        | none   | build, then type-check and tests from `8b1d3c6`   |

- The first four runs built the site and failed at their deploy step; `96f3a55` deployed for the first time. The two other failures are the first runs with the checks of `8b1d3c6`: a failing test, then a type error, each fixed in the next commit and never deployed.
- The checks and the deploy ran on `main` only: a pull request got no check until the CI of 2026-10-17 ([0009](0009-cloudflare-pages.md)).
- Each page other than the home page has no HTML file of its own: GitHub Pages answers a reload of `/projects` with its 404 page. [0008](0008-html-file-per-route.md) writes one file per route.
