# 0014. Deploy `develop` to production every morning

- Date: 2026-10-18
- Status: Accepted

## Context

Since [0009](0009-cloudflare-pages.md), each push to `main` deployed production, and every change reached `main` through a pull request from `develop`, opened and merged by hand: [#44](https://github.com/AIssoufi/issoufi.fr/pull/44), _chore: release 1.0.0 to production_, on 2026-10-17. The pull requests merged into `develop` waited online until the next of these, with no set time.

## Decision

In [#146](https://github.com/AIssoufi/issoufi.fr/pull/146), merged on 2026-10-18, `.github/workflows/deploy-production.yml`:

- runs every morning at 6:00 in Paris, with one cron for summer time and one for winter time, of which only the one that matches the offset of Europe/Paris goes on;
- stops when `main` already has the tree of `develop`, and unless the last CI of `develop` on that exact commit passed;
- merges that tested commit into `main`, fails unless the merge has exactly its tree, and pushes with a deploy key that the ruleset of `main` lets through. That push starts the CI on `main`, which tests, deploys and smoke-tests production;
- can run by hand, with a `dry_run` input that pushes nothing.

No pull request targets `main` any more. Later pull requests extend the workflow: it merges the release pull request of the day first ([#171](https://github.com/AIssoufi/issoufi.fr/pull/171), [#268](https://github.com/AIssoufi/issoufi.fr/pull/268), [0012](0012-release-please.md)), and a Cloudflare Worker starts it on time ([0016](0016-cloudflare-worker-deploy-trigger.md)).

## Alternatives considered

The pull request records no alternative. The ones open then:

- **Deploy each merge into `develop`**: production gets each change at once, but also each pull request of a series before the last one lands.
- **Keep the pull requests from `develop` to `main`**: a step by hand for each deployment, with no set time.
- **Deploy `develop` itself, with no `main`**: the preview of `develop` and production become the same deployment, with no branch that holds what production serves.

## Consequences

Read on 2026-10-20 with `gh pr list --base main --state all` and `gh api 'repos/AIssoufi/issoufi.fr/actions/workflows/<workflow>/runs'`, for `ci.yml` on `main` and `deploy-production.yml`.

| Figure                                            | Before (#33 to #146)     | After (#146 to 2026-10-19)                                                                  |
| ------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| Pull requests to `main`                           | 1 (#44)                  | 0                                                                                           |
| Deployments of production                         | 1, by hand on 2026-10-17 | 4: one on 2026-10-18, three on 2026-10-19 (one scheduled, two run by hand)                  |
| First scheduled run, after 6:00 in Paris          |                          | 5 h 30 min late on 2026-10-19                                                               |
| Push to `main` to production deployed (first run) | 1 min 30 s (#44)         | 3 min 24 s on 2026-10-18, with the browser tests ([0013](0013-playwright-browser-tests.md)) |

- Production gets the changes of `develop` each morning, or when someone starts the workflow by hand, and only after their CI passed on the exact commit it ships.
- The ruleset of `main` lets the deploy key through, and the `DEPLOY_KEY` secret holds its private part: the site owner alone manages both ([Deployment](../deployment.md)).
- GitHub starts the scheduled runs late, or not at all, at busy times: the first scheduled morning, 2026-10-19, started 5 h 30 min late, which [0016](0016-cloudflare-worker-deploy-trigger.md) addresses.
