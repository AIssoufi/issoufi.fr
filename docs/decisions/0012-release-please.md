# 0012. Version and release with release-please

- Date: 2026-10-17
- Status: Accepted

## Context

`package.json` held version `0.1.0` from the first commit, the repository had no tag, no release and no changelog: nothing said which commits a deployment held, nor what changed between two of them. The commits followed the Conventional Commits format since [0002](0002-prettier-and-commitlint.md), which a tool can read to tell a fix from a feature.

## Decision

In [#34](https://github.com/AIssoufi/issoufi.fr/pull/34), merged on 2026-10-17, the last step of the CI of that day:

- `.github/workflows/release.yml` runs release-please on each push to `develop`. It keeps a release pull request open, with the next version in `package.json` and the new entry of `CHANGELOG.md`; merging it tags `vX.Y.Z` and publishes a GitHub release.
- `release-please-config.json`: tags without a component, a history from `6674b92`, the commit before the move to Vite ([0003](0003-vite-and-vitest.md)), and a changelog of the features, fixes, performance changes, reverts, refactors and docs. A `Release-As: 1.0.0` footer makes the first version 1.0.0.
- A release pull request updated with the `GITHUB_TOKEN` starts no workflow, so the release workflow dispatches the CI on its branch.

## Alternatives considered

The pull request records no alternative. The ones open then:

- **semantic-release**: it releases on each push, from the CI, with no pull request to review the version and the changelog first.
- **Changesets**: each pull request writes a file that describes its change, by hand, where the commits already say it.

## Consequences

Read on 2026-10-20 with `gh release list` and `git show 4ee7e5c:package.json`.

| Figure                    | Before           | After                                           |
| ------------------------- | ---------------- | ----------------------------------------------- |
| Version in `package.json` | 0.1.0 since 2021 | 1.0.0 on 2026-10-17, 1.4.1 on 2026-10-20        |
| Tags and GitHub releases  | 0                | 6 by 2026-10-20: v1.0.0 to v1.4.1               |
| `CHANGELOG.md`            | none             | one entry per version, written from the commits |

- A `feat` or `fix` commit is now a line of the public changelog: the project keeps these types for what a visitor of the site notices ([`CLAUDE.md`](../../CLAUDE.md)).
- Since [#171](https://github.com/AIssoufi/issoufi.fr/pull/171) and [#268](https://github.com/AIssoufi/issoufi.fr/pull/268), the daily deploy ([0014](0014-daily-deploy.md)) merges the release pull request of the day before it deploys, so production ships a tagged version ([Releases](../releases.md#daily-release)).
- Each release attaches the standalone build of the site, which opens from the disk with no server ([Releases](../releases.md#standalone-build)).
