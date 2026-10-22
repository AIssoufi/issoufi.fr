# Tooling

The tools that let several agents work on this repository at the same time. What every repository of the owner shares, with the versions of the tools and how they hand over to each other, is on the [Tooling page of the agentic architecture](https://github.com/AIssoufi/AIssoufi/blob/main/docs/agentic-architecture/tooling.md). This page says what this repository adds or does differently.

## Claude Code

Every agent is a [Claude Code](https://claude.com/claude-code) session: the master of this repository in its main checkout on `develop`, one worker per ticket, and the sub-agents they launch, the conventions reviewer and the visual tester ([reviews](reviews.md)) the repository auditor, and the other sub-agents of [roles](roles.md). They read [`CLAUDE.md`](../../CLAUDE.md) at every turn, so it holds one line per rule that the code does not show.

## cmux

Each agent runs in its own [cmux](https://github.com/manaflow-ai/cmux) workspace, named after its ticket for a worker (`ISF-35`). The agents talk with `cmux agent message`: a worker sends `FINDING:`, `QUESTION:`, `BLOCKED:`, `UPDATE:` and `DONE:` to its master ([messages](roles.md#messages)).

## Worktrunk

Each ticket gets its own [Worktrunk](https://github.com/max-sixty/worktrunk) worktree, in `~/Sources/worktrees.noindex/<repo>.<ticket>`, a folder that Spotlight skips. The hooks of this repository, in [`.config/wt.toml`](../../.config/wt.toml), run in each new worktree before anything else, at the same time:

| Hook                  | Command                                            | Why                                                                                                                                           |
| --------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `pre-start` `install` | `pnpm install --frozen-lockfile`                   | A new worktree has no dependencies yet                                                                                                        |
| `pre-start` `port`    | `echo PORT={{ branch \| hash_port }} > .env.local` | A port between 10000 and 19999, stable for its branch, so that several worktrees serve the app at once ([development](../development.md#run)) |

## Commits

commitlint checks each commit message, in the `commit-msg` hook of Husky and in the `commits` job of the CI, with the Conventional Commits rules and a rule of this repository: every commit names its ticket in a `Refs: ISF-<n>` footer ([#322](https://github.com/AIssoufi/issoufi.fr/issues/322)). On a branch named after a ticket, the `prepare-commit-msg` hook adds that footer when the message has none. The release commits of release-please and the commits of Dependabot are exempt, and the title of a pull request, which GitHub writes in the merge commit, is linted without the footer, again whenever the pull request is edited: a worker fixes a title with `gh pr edit --title`, without a push.

## CI and Cloudflare

The workflows of [`.github/workflows/`](../../.github/workflows/):

| Workflow                 | Runs                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                 | On each pull request and push to `develop` and `main`: format, lint, types, tests, commits, build, browser and visual tests, then the deploy and a smoke test |
| `pull-request-title.yml` | On each pull request opened, pushed, edited or reopened: lints its title with commitlint, so that a title fixed with `gh pr edit` is checked without a push   |
| `release.yml`            | On each push to `develop`: release-please keeps the release pull request up to date ([releases](../releases.md))                                              |
| `standalone-build.yml`   | For each release of `release.yml`, or by hand with a tag: attaches the standalone build to its release ([releases](../releases.md#standalone-build))          |
| `deploy-production.yml`  | Every morning: releases `develop` to `main`, which deploys production ([deployment](../deployment.md))                                                        |
| `rebuild.yml`            | Every month: rebuilds production, so that the years of experience stay right                                                                                  |

The site is hosted on Cloudflare Pages, and each branch gets a preview at `<branch>.issoufi-fr.pages.dev`, which the visual tester can open. A Cloudflare Worker, the deploy trigger of [`scripts/deploy-trigger/`](../../scripts/deploy-trigger/), starts the daily deploy, since GitHub's scheduler delays or drops its runs ([#321](https://github.com/AIssoufi/issoufi.fr/issues/321), [decision 0016](../decisions/0016-cloudflare-worker-deploy-trigger.md)).
