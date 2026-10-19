# Development

## Prerequisites

- Node.js 24, read from `.nvmrc`.
- pnpm 10, pinned in `package.json`: a recent pnpm switches to it on its own.
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
| `pnpm format`, `format:check` | Prettier                                                |
| `pnpm size`                   | Check the size of the scripts, after a build            |
| `pnpm smoke-test [url]`       | Check that a deployed site serves the files of `dist/`  |
| `pnpm build:standalone`       | Build the site that opens from the disk                 |
| `pnpm og-image`, `pnpm icons` | Regenerate the link preview images and the icons        |
| `pnpm cv`, `pnpm cv:check`    | Regenerate the CVs, or only check that they still match |

The generators are described in [Assets](assets.md#generated-files).

## Checks

- On commit, a Git hook runs ESLint and Prettier on the staged files, then commitlint on the message.
- A lint error stops the commit.
- The CI also lints the workflows with actionlint and ShellCheck.
  To run them locally: `brew install actionlint shellcheck`, then `actionlint`.
