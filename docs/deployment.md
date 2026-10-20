# Deployment

## Environments

The site is static, hosted on Cloudflare Pages.

| Source       | Deployed to                                   |
| ------------ | --------------------------------------------- |
| `main`       | production, [issoufi.fr](https://issoufi.fr/) |
| `develop`    | a preview, `develop.issoufi-fr.pages.dev`     |
| Pull request | a preview, `<branch>.issoufi-fr.pages.dev`    |

Only a tested build goes online, and a smoke test then checks the deployed site.

## Short links

`public/_redirects` holds the redirects that Cloudflare Pages serves, in 302 so that a target can change: the CVs link to `issoufi.fr/code`, the repository, and `issoufi.fr/method`, the [AI workflow](ai-workflow/README.md). A short link has no language prefix, and its spec checks that no page nor file of the site uses its path. The smoke test requests each one on the deployed site and expects its target in one hop; a redirect whose source holds a splat (`*`) or a placeholder (`:name`) gets no check.

## Continuous integration

On every pull request, and on every push to `develop` and `main`, GitHub Actions runs:

1. formatting, lint and type-check, and a lint of the workflows;
2. the unit tests with coverage;
3. the build, its size, and the browser tests over three parallel jobs;
4. on pull requests, a check of the commit messages and of new dependencies, and a comparison of the screenshots of every page with the base branch, which only informs;
5. the deployment and its smoke test, which also checks the [short links](#short-links), and on `main` a check that `http://issoufi.fr/`, `http://www.issoufi.fr/` and `https://www.issoufi.fr/` redirect to `https://issoufi.fr/` in one hop.

## Daily release and deploy

Every morning between 6:00 and 7:00, Paris time, a Cloudflare Worker starts a workflow that:

1. releases the version of the day (see [Releases](releases.md));
2. merges the tested `develop` into `main`, whose CI deploys production.

- The Worker, the deploy trigger of `scripts/deploy-trigger/`, starts the workflow on `develop` at 6:05 and 6:35 in Paris, in summer as in winter. Its Cron Triggers fire in UTC, at 4:05, 4:35, 5:05 and 5:35, and it starts a run only between 6:00 and 7:00 in Paris. Why a Worker: [decision 0016](decisions/0016-cloudflare-worker-deploy-trigger.md).
- GitHub's own schedule stays as a fallback: a run every 30 minutes from 6:07, until 8:37 in summer and 7:37 in winter. GitHub delays these runs by hours, or drops them, so they deploy only when the Worker could not.
- The runs of the Worker show as _Scheduled deploy to production_ in the Actions tab. With those of GitHub's schedule, they are the scheduled runs: from 6:00, the first one that passes deploys, and the later ones of the day stop at once.
- A run waits up to 20 minutes for a CI of `develop` still running. When `develop` has not passed its CI, the run fails, so that a later one tries again: a red run or badge may mean a deploy put off, whose notice or warning says why.
- _Actions → Deploy to production → Run workflow_ releases and deploys at once; its `dry_run` option shows what it would do, without merging or pushing, and its `scheduled` option runs it as the Worker does.
- A warning says when someone has to act, such as after a day without any scheduled run.
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
- **Redirects**, in the Cloudflare zone of `issoufi.fr`: a redirect rule sends `http*://www.*` to `https://issoufi.fr/` in 301, with its path and query, so that a request over HTTP reaches it in one hop, without going through _Always Use HTTPS_ first; that setting sends `http://issoufi.fr/` to HTTPS.
- **Cloudflare secrets**: `CLOUDFLARE_API_TOKEN`, a token with the _Account → Cloudflare Pages → Edit_ permission, and `CLOUDFLARE_ACCOUNT_ID`. The automatic builds of Cloudflare stay paused: the CI deploys the site.
- **Deploy trigger**, the Cloudflare Worker `issoufi-fr-deploy-trigger`, deployed from `scripts/deploy-trigger/` by the site owner, never by the CI:
  1. Create a fine-grained personal access token limited to this repository, with the _Actions: Read and write_ permission alone, besides the _Metadata: Read_ that GitHub adds, and an expiry date.
  2. Deploy the Worker: `pnpm dlx wrangler deploy --config scripts/deploy-trigger/wrangler.jsonc`.
  3. Store the token as its `GITHUB_DISPATCH_TOKEN` secret, which stays in Cloudflare, never in the repository: `pnpm dlx wrangler secret put GITHUB_DISPATCH_TOKEN --config scripts/deploy-trigger/wrangler.jsonc`.
  4. Store a new token before this one expires. Without a valid token, each run of the Worker fails, with the answer of GitHub in its logs (_Workers & Pages → issoufi-fr-deploy-trigger → Logs_), and only GitHub's schedule deploys, late.

  To try it: `pnpm dlx wrangler dev --test-scheduled --config scripts/deploy-trigger/wrangler.jsonc`, with the token in `scripts/deploy-trigger/.dev.vars`, then open `http://localhost:8787/__scheduled`. Outside 6:00 to 7:00 in Paris, it only logs why it starts nothing.

- **Release GitHub App**, optional: the `RELEASE_APP_CLIENT_ID` variable and the `RELEASE_APP_PRIVATE_KEY` secret. The CI of the release pull request then starts without approval ([steps in #268](https://github.com/AIssoufi/issoufi.fr/pull/268)).
