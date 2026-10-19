# Deployment

## Environments

The site is static, hosted on Cloudflare Pages.

| Source       | Deployed to                                   |
| ------------ | --------------------------------------------- |
| `main`       | production, [issoufi.fr](https://issoufi.fr/) |
| `develop`    | a preview, `develop.issoufi-fr.pages.dev`     |
| Pull request | a preview, `<branch>.issoufi-fr.pages.dev`    |

Only a tested build goes online, and a smoke test then checks the deployed site.

## Continuous integration

On every pull request, and on every push to `develop` and `main`, GitHub Actions runs:

1. formatting, lint and type-check, and a lint of the workflows;
2. the unit tests with coverage;
3. the build, its size, and the browser tests over three parallel jobs;
4. on pull requests, a check of the commit messages and of new dependencies, and a comparison of the screenshots of every page with the base branch, which only informs;
5. the deployment and its smoke test.

## Daily release and deploy

Every morning from 6:07, Paris time, a scheduled workflow:

1. releases the version of the day (see [Releases](releases.md));
2. merges the tested `develop` into `main`, whose CI deploys production.

- A run every 30 minutes, until 8:37 in summer and 7:37 in winter, catches a run that GitHub delays or skips.
- A run waits up to 20 minutes for a CI of `develop` still running. When `develop` has not passed its CI, the run fails, so that a later one tries again: a red run or badge may mean a deploy put off, whose notice or warning says why.
- _Actions → Deploy to production → Run workflow_ releases and deploys at once; its `dry_run` option shows what it would do, without merging or pushing.
- A warning says when someone has to act.
- The deploy fetches `develop` again after the release: `actions/checkout` sets `origin/develop` back to the commit that started the run, which lacks the release merge.
- A change merged into `develop` is online the next morning.
- A monthly run rebuilds production, so that the years of experience written in the pages stay right.

## HTTP headers

- Every file gets security headers: a Content Security Policy, HSTS, a Permissions-Policy and frame protection.
- The policy allows the files of the site only, and no inline script.
- The files whose name holds a hash of their content are cached for a year; the others are revalidated.

## Dependencies

- Dependabot opens weekly update pull requests against `develop`.
- pnpm installs no version published less than 7 days ago.

## Setup by the site owner

Done in the repository settings, never by a workflow or an agent:

- **Deploy key** with write access, its private key in the `DEPLOY_KEY` secret: the daily workflow pushes to `main` with it.
  To replace it, create an ed25519 key pair, add its public key with write access, store its private key in `DEPLOY_KEY`, then delete the old key.
- **Rulesets** on `main` and `develop`: pull requests with passing checks only. The deploy key may bypass the one of `main`.
- **Cloudflare secrets**: `CLOUDFLARE_API_TOKEN`, a token with the _Account → Cloudflare Pages → Edit_ permission, and `CLOUDFLARE_ACCOUNT_ID`. The automatic builds of Cloudflare stay paused: the CI deploys the site.
- **Release GitHub App**, optional: the `RELEASE_APP_CLIENT_ID` variable and the `RELEASE_APP_PRIVATE_KEY` secret. The CI of the release pull request then starts without approval ([steps in #268](https://github.com/AIssoufi/issoufi.fr/pull/268)).
