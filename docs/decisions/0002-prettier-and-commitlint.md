# 0002. Format with Prettier and check the commit messages

- Date: 2024-02-17
- Status: Accepted

## Context

Until 2024-02-17, nothing formatted the code nor checked the commit messages. Of the 29 commits before this decision, 7 have a subject in the [Conventional Commits](https://www.conventionalcommits.org/) format: the others read like `fix burger menu` or `WIP`, from which no tool can tell a fix from a feature.

## Decision

Two commits pushed to the default branch, with no pull request:

- `ddc2cc8` installs Prettier 3.2.5 with its `.prettierrc` (single quotes, 100 characters a line), and a Husky `pre-commit` hook that runs lint-staged, which formats each staged file with Prettier.
- `aeb1e06` installs commitlint with `@commitlint/config-conventional`, and a Husky `commit-msg` hook that refuses a message out of the format.

## Alternatives considered

The commits record no alternative. The ones open then:

- **Formatting in the editor only**: it depends on the settings of each machine, and nothing stops an unformatted file.
- **Checks in a CI only**: the repository had no CI until 2026-03-25 ([0007](0007-github-pages.md)), and a hook stops the mistake before the commit exists.

## Consequences

Counted on 2026-10-20 with `git log --no-merges --format=%s`, against the types of `@commitlint/config-conventional`:

| Figure                                             | Before `aeb1e06` | After `aeb1e06`, up to `a152ac1` |
| -------------------------------------------------- | ---------------- | -------------------------------- |
| Commit subjects in the Conventional Commits format | 7 of 29          | 634 of 635                       |

- The one subject out of the format after it, `Revert "refactor: …"`, is the subject that `git revert` writes, which commitlint accepts.
- The format of the commits is what later lets release-please write the changelog and choose each version ([0012](0012-release-please.md)).
- The hooks run on the machine of the author only. From 2026-10-17, the CI checks the formatting and the commits of each pull request too ([#30](https://github.com/AIssoufi/issoufi.fr/pull/30)).
