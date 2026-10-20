# 0001. Start the daily deploy from a Cloudflare Worker

- Date: 2026-10-20
- Status: Accepted

## Context

`deploy-production.yml` releases the version of the day and merges `develop` into `main` every morning from 6:00 in Paris ([Deployment](../deployment.md#daily-release-and-deploy)). Until this decision, only its `schedule` crons started it in the morning.

GitHub states that the `schedule` event "can be delayed during periods of high loads of GitHub Actions workflow runs", that "high load times include the start of every hour", and that some queued jobs may then be dropped ([Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)).

The workflow exists since 2026-10-18 at 07:54 UTC, so the 14 days before this decision hold two mornings of scheduled runs. Read on 2026-10-20 at 7:21 UTC with `gh api 'repos/AIssoufi/issoufi.fr/actions/workflows/388267948/runs?event=schedule'`:

| Morning    | Crons on `develop`, in UTC                                 | Scheduled runs created, in UTC | Start delay                                                  |
| ---------- | ---------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------ |
| 2026-10-19 | 4:00 and 5:00 (6:00 and 7:00 in Paris)                     | 9:29:57 and 10:28:13           | 5 h 30 min and 5 h 28 min                                    |
| 2026-10-20 | every 30 minutes from 4:07 to 6:37 (6:07 to 8:37 in Paris) | none at 7:21                   | over 3 h 14 min for the first cron, over 44 min for the last |

- The API does not say which cron started a run, so the delays of 2026-10-19 take the runs in the order of the crons. Either way, the first run of that morning started at 11:29 in Paris instead of 6:00.
- The crons of every 30 minutes, away from the start of the hour, reached `develop` on 2026-10-19 ([#268](https://github.com/AIssoufi/issoufi.fr/pull/268)), and brought no run on time the next morning.

## Decision

In [#333](https://github.com/AIssoufi/issoufi.fr/pull/333), for [#321](https://github.com/AIssoufi/issoufi.fr/issues/321), a Cloudflare Worker, `issoufi-fr-deploy-trigger`, whose code and tests live in `scripts/deploy-trigger/`, starts the workflow from outside GitHub:

- Its Cron Trigger fires at 4:05, 4:35, 5:05 and 5:35 UTC. The Worker acts only on the two that fall between 6:00 and 7:00 in Paris, at 6:05 and 6:35, in summer as in winter.
- It calls `workflow_dispatch` of `deploy-production.yml` on `develop` through the REST API, with the `scheduled` input. The run shows as _Scheduled deploy to production_.
- The crons of GitHub stay as a fallback. The runs of both count as scheduled runs: from 6:00, the first one that passes deploys, and the later ones of the day stop at their first step.
- It authenticates with a fine-grained token limited to this repository, with the _Actions: Read and write_ permission alone, stored as the `GITHUB_DISPATCH_TOKEN` secret of the Worker, never in the repository. The site owner creates the token and deploys the Worker; the CI does neither.
- Cloudflare already hosts the site, so the trigger adds no provider nor account. Its one Cron Trigger fits the Free plan of Workers, which allows 5 per account ([limits](https://developers.cloudflare.com/workers/platform/limits/)).

## Alternatives considered

- **The crons of GitHub alone, more of them**: the step taken on 2026-10-19, a run every 30 minutes away from the start of the hour. The morning of 2026-10-20 got no run by 7:21 UTC.
- **A scheduler of another provider**, such as a hosted cron service or a scheduled job of another CI, calling the same API: it adds an account, and gives the token to one more provider.
- **A cron on a personal machine**: it starts nothing when the machine is off or offline.
- **A deploy from Cloudflare itself**, without GitHub Actions: it moves the release, the wait for the CI of `develop` and the push to `main` out of the tested workflow, and needs a key that can push to `main` outside GitHub.
- **`repository_dispatch` rather than `workflow_dispatch`**: the workflow already takes `workflow_dispatch` for the runs started by hand, and its schedule step tells the scheduled ones by their title. A third event would add a case to that step.

## Consequences

| Figure                                                               | Before                                                                     | After                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Start of the first scheduled run of the morning, after 6:00 in Paris | 5 h 30 min on 2026-10-19; none by 3 h 21 min on 2026-10-20 (9:21 in Paris) | not measured: the site owner deploys the Worker after the merge |

- On a normal morning, the run of 6:05 in Paris deploys, and the runs of the crons of GitHub stop at their first step. When the Worker starts no run, the crons still deploy, late.
- The token expires: the site owner stores a new one before its date. Without a valid token, each run of the Worker fails, with the answer of GitHub in its logs in Cloudflare. The warning of the schedule step counts the runs of both sources, so it says nothing while the crons of GitHub still start runs: a warning for that case is left to do ([#332](https://github.com/AIssoufi/issoufi.fr/issues/332)).
- The site owner deploys the Worker by hand, with `wrangler deploy`: a change of its code or of its crons is online after the next of these deploys only.
- The tests, the lint and the type-check of the repository cover the Worker, at 100 % coverage. The site, its build and its Content Security Policy do not change.
- The start delays of the Worker are not measured yet: the runs titled _Scheduled deploy to production_ give them, from its first morning, and fill the _After_ column above.
