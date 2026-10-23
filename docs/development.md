# Development

## Prerequisites

- Node.js 24, read from `.nvmrc`.
- pnpm 12, at the exact version of the `packageManager` field of `package.json`, which the CI installs. pnpm does not switch to it on its own ([0018](decisions/0018-pnpm-12.md)): install it with `pnpm self-update <that version>`.
- Chromium for the browser tests and the generators, installed once:
  `pnpm exec playwright install --only-shell chromium`.

## Run

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

- Each worktree gets its own port, written as `PORT` in its `.env.local`.
- `pnpm dev`, `pnpm preview`, the browser tests and the screenshot comparison use it.
- A server stops at once when its port is taken, rather than moving to another one.

## Scripts

| Script                        | Purpose                                                 |
| ----------------------------- | ------------------------------------------------------- |
| `pnpm dev`                    | Dev server                                              |
| `pnpm build`                  | Type-check, then build to `dist/`                       |
| `pnpm preview`                | Serve `dist/`                                           |
| `pnpm test`, `test:watch`     | Unit tests                                              |
| `pnpm test:coverage`          | Unit tests with coverage, which must stay at 100 %      |
| `pnpm test:browser`           | Browser tests, on the build                             |
| `pnpm test:visual [--base]`   | Compare the screenshots of every page with `develop`    |
| `pnpm typecheck`              | Type-check the app, the Node.js code and the scripts    |
| `pnpm lint`                   | ESLint                                                  |
| `pnpm knip`                   | Unused files, exports and dependencies                  |
| `pnpm format`, `format:check` | Prettier                                                |
| `pnpm size`                   | Check the size of the scripts, after a build            |
| `pnpm smoke-test [url]`       | Check that a deployed site serves the files of `dist/`  |
| `pnpm build:standalone`       | Build the site that opens from the disk                 |
| `pnpm og-image`, `pnpm icons` | Regenerate the link previews, the icons and the logo    |
| `pnpm cv`, `pnpm cv:check`    | Regenerate the CVs, or only check that they still match |
| `pnpm cv:audit <folder>`      | Text and page images of the CVs to [audit](cv-audit.md) |

The generators are described in [Assets](assets.md#generated-files).

## Checks

- On commit, a Git hook runs ESLint and Prettier on the staged files, then commitlint on the message.
- On a ticket branch (`ISF-35`), the `prepare-commit-msg` hook adds the footer `Refs: ISF-35` to a message that has no `Refs:` footer yet, before the editor opens. It leaves merge and squash messages alone.
- commitlint checks Conventional Commits and the `Refs: ISF-<n>` footer ([`commitlint.config.mjs`](../commitlint.config.mjs), with its rule in [`scripts/commits/`](../scripts/commits/)).
  The CI lints the commits of a pull request with it, and its title as a commit header without the footer ([`title.config.mjs`](../scripts/commits/title.config.mjs)), since GitHub writes the title in the merge commit.
  The title has a workflow of its own, [`pull-request-title.yml`](../.github/workflows/pull-request-title.yml): it runs on each push to the pull request, and again on each edit of it, which starts no other check. A fixed title needs no new commit.
- A lint error stops the commit.
- The CI also lints the workflows with actionlint and ShellCheck.
  To run them locally: `brew install actionlint shellcheck`, then `actionlint`.
- The same job fails on an action of a third party that a workflow or an action does not pin by the SHA of a commit ([Dependencies](deployment.md#dependencies)).
  To run the check locally: `node scripts/ci/check-action-pins.mjs`.
- The same job fails on a checkout that keeps its git credentials without a comment naming the step that uses them ([Workflows](conventions.md#workflows)).
  To run the check locally: `node scripts/ci/check-checkout-credentials.mjs`.
