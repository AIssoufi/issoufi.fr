# 0009. Host on Cloudflare Pages, deployed from GitHub Actions

- Date: 2026-10-17
- Status: Accepted

## Context

The site was online at `https://aissoufi.github.io/`, deployed by GitHub Pages on each push to `main` ([0007](0007-github-pages.md)). GitHub Pages serves the files of a site as they are: a site cannot set its own HTTP headers, such as a Content Security Policy, nor declare HTTP redirects. A pull request got no deployment of its own to check before the merge, and no check at all, since the workflow ran on `main` only.

## Decision

Three pull requests, merged on 2026-10-17:

- [#15](https://github.com/AIssoufi/issoufi.fr/pull/15) prepares the site for Cloudflare Pages on `https://issoufi.fr`: a `public/_redirects` file, Node.js pinned to 24 in `.nvmrc` for the builds of Cloudflare, and the settings of the project in the README. Cloudflare builds each push itself, while GitHub Pages still deploys `main`.
- [#29](https://github.com/AIssoufi/issoufi.fr/pull/29) renames the repository from `AIssoufi.github.io` to `issoufi.fr`, turns GitHub Pages off, and replaces `deploy.yml` with `ci.yml`, which checks pushes and pull requests. A new `AIssoufi.github.io` repository redirects each old address to the same path on `issoufi.fr`.
- [#33](https://github.com/AIssoufi/issoufi.fr/pull/33) deploys from GitHub Actions instead of the builds of Cloudflare: the `deploy` job uploads the `dist/` that the CI built and tested with `wrangler pages deploy`, to production for `main` and to a preview for `develop` and each pull request, then a smoke test checks each page of the deployment.

## Alternatives considered

- **Keep GitHub Pages**: no headers nor redirects of the site, and no preview per pull request.
- **Keep the builds of Cloudflare**, the state between #15 and #33: "Today Cloudflare deploys every push, even when the CI fails" (#33). Deploying from the CI ships only the tested build.
- **Another host with previews, such as Netlify or Vercel**: the pull requests record no comparison with them.

## Consequences

Read on 2026-10-20 with `gh api 'repos/AIssoufi/issoufi.fr/actions/runs/<run>/jobs'`. Before: the four runs of _Deploy to GitHub Pages_ on 2026-10-17, the last ones. After: the first run of `ci.yml` that deployed production, on 2026-10-17 at 21:11 UTC (run 39069889731). Each duration goes from the creation of the run, or the start of the job, to its end.

| Figure                          | Before (GitHub Pages)                  | After (Cloudflare Pages, first production run) |
| ------------------------------- | -------------------------------------- | ---------------------------------------------- |
| Push to `main` to site deployed | 57 s, 1 min 37 s, 1 min 9 s, 1 min 9 s | 1 min 30 s; 1 min 45 s with the smoke test     |
| Deploy job                      | 9 s, 35 s, 10 s, 11 s                  | 22 s                                           |
| Checks before the deploy        | type-check, tests, build               | format, lint, type-check, tests, build         |
| Check after the deploy          | none                                   | smoke test of each page and of the redirects   |
| Deployment per pull request     | none                                   | a preview, `<branch>.issoufi-fr.pages.dev`     |

- The site sets its own headers, which the build writes into `_headers`: the Content Security Policy, HSTS and the cache of the hashed files ([Deployment](../deployment.md)). It also serves each not found page with a 404 status.
- Each pull request gets a preview to check before the merge, which the visual reviews and the Lighthouse measures of later pull requests use.
- The deploy needs two secrets, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and the builds of Cloudflare stay paused in its settings.
- Production still deploys on each push to `main`, by hand through a pull request from `develop`, until the daily deploy ([0014](0014-daily-deploy.md)).
