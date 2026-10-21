# 0019. Lock wrangler and pin the actions of third parties

- Date: 2026-10-22
- Status: Accepted

## Context

The build installs every package from `pnpm-lock.yaml` ([0004](0004-pnpm.md)), with no version published less than 7 days before (`minimumReleaseAge`, [0018](0018-pnpm-12.md)), and Dependabot proposes each update after the same 7 days. Two parts of the CI ran outside these rules:

- The `deploy` job ([0009](0009-cloudflare-pages.md)) downloaded the build and nothing else, so `cloudflare/wrangler-action@v4`, with `packageManager: npm`, found no wrangler and ran `npm i wrangler@4`: the latest 4.x at each run, its dependencies resolved at that moment. The production deploy of 2026-10-21 ([run 39542763695](https://github.com/AIssoufi/issoufi.fr/actions/runs/39542763695)) ran wrangler 4.151.3, published on npm 16 hours before.
- The workflows referenced three actions of third parties by a tag: `cloudflare/wrangler-action@v4`, `googleapis/release-please-action@v5`, and `pnpm/action-setup@v6.1.0` in the setup action that every job runs. The owner of an action can move its tags, so what a job runs could change with no change in this repository.

## Decision

In the pull request that closes [#359](https://github.com/AIssoufi/issoufi.fr/issues/359):

- wrangler joins the `devDependencies`, at 4.151.0, the latest release older than 7 days when pnpm resolved it. pnpm 12 asks a decision for the install scripts of its esbuild and workerd: `allowBuilds` denies both. Their binaries come from the platform packages of the lockfile, which these scripts only check, or download from npm when one is missing. Without them, `wrangler pages deploy`, `wrangler deploy --dry-run` and `wrangler dev` work.
- The `deploy` job checks out the repository and runs the setup action, which installs the lockfile, wrangler among its packages. `wrangler-action` gets `packageManager: pnpm` and no `wranglerVersion`: it runs `pnpm exec wrangler --version`, finds the installed wrangler and runs it, without installing one of its own.
- The three actions are referenced by the SHA of the commit that their tag pointed to, the version in a comment: `wrangler-action` 4.1.3, `action-setup` 6.1.0 and `release-please-action` 5.0.0. The `github-actions` ecosystem of Dependabot updates the SHA and the comment, after its 7 days of cooldown.
- The actions of GitHub, `actions/*`, keep their major tag.
- [Deployment](../deployment.md) runs the commands of the deploy trigger Worker with `pnpm exec wrangler`, the same locked version, instead of `pnpm dlx wrangler`, which fetches the latest one.

## Alternatives considered

- **`wranglerVersion` set to an exact version**, with no checkout: the action would still install wrangler with npm at each run, its dependencies resolved at that moment, and the version would live in a workflow that the npm updates of Dependabot do not change.
- **`pnpm exec wrangler pages deploy` in a step of its own**, without `wrangler-action`: one action of a third party less, but the job would read the URLs of the deployment from the output file of wrangler itself, which the action already does for the URL of the environment and for the smoke test.
- **Allowing the install scripts of esbuild and workerd**: the deploy does not need them, and an allowed script runs at each install.
- **A package of its own for wrangler**, so that the other jobs do not install it: a second lockfile, with its own entry in Dependabot and its own setup, to save the jobs the time of the [Consequences](#consequences).
- **Pinning the actions of GitHub too**: GitHub publishes them and also provides the runners that run every job, so a SHA would not narrow the parties that a job depends on.

## Consequences

The CI figures are read with `gh api 'repos/AIssoufi/issoufi.fr/actions/runs/<run>/jobs'`, each duration from the start of the job or of the step to its end. Before: the last 10 successful push runs of `ci.yml` on `develop`, from 2026-10-20 08:26 to 2026-10-21 12:39 UTC. After: the `deploy` job of a run of `ci.yml` on the branch ([run 39686150526](https://github.com/AIssoufi/issoufi.fr/actions/runs/39686150526)), run three times on 2026-10-21, each time with the pnpm store in the cache. The sizes of the cache come from the cache list of the repository. The local figures: medians of three clean installs, base and branch in turn, with Node.js 24.22.0 and the store of pnpm warm. The two advisories, on `@vitest/mocker`, come before this change.

| Figure                             | Before                                | After                               |
| ---------------------------------- | ------------------------------------- | ----------------------------------- |
| `deploy` job, median               | 22 s, from 20 to 36 s (10 runs)       | 26 s, from 21 to 29 s (3 runs)      |
| Its `wrangler-action` step, median | 18 s, from 14 to 30 s                 | 7 s, from 7 to 8 s                  |
| Setup step, median                 | 11.5 s, from 7 to 16 s (`lint` job)   | 11 s, from 9 to 13 s (`deploy` job) |
| Cache of the pnpm store            | 98.3 MB                               | 156.2 MB                            |
| wrangler that the deploy runs      | the latest 4.x, 4.151.3 on 2026-10-21 | 4.151.0, from the lockfile          |
| Clean install, local               | 0.5 s                                 | 0.5 s                               |
| Direct dependencies (dev)          | 35 (28)                               | 36 (29)                             |
| `pnpm audit` advisories            | 2 moderate                            | 2 moderate                          |

- The deploy runs a version of wrangler that the lockfile locks, at least 7 days old, which Dependabot updates in a pull request with the rest of the dependencies, and `pnpm exec wrangler` runs the same one on a machine. The log of the job shows `using pre-installed wrangler version 4.151.0`, and no `npm i wrangler`.
- The `deploy` job takes about 4 s more: the setup that it now runs costs more than the `npm i wrangler@4` and the search for a wrangler that the action no longer does.
- Each job runs the code of the commit that its workflow names, until a pull request changes it.
- Every job installs wrangler and its dependencies, so the cache of the pnpm store that each job restores grows by 57.9 MB. The setup step of the `deploy` job, with that larger cache, takes as long as the one of `lint` did before.
- The build does not change: the 77 files of `pnpm build` are byte for byte those of `develop`. Vite now finds the esbuild of wrangler, an optional peer that it loads only when a config asks for it, and none does.
- The duration of the CI is in the pull request.
