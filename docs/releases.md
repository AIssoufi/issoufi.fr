# Releases

## Versions and changelog

- [release-please](https://github.com/googleapis/release-please) writes the version and [`CHANGELOG.md`](../CHANGELOG.md) from the Conventional Commits.
- Never edit the changelog by hand.
- `fix` raises the patch version, `feat` the minor one, a breaking change the major one.
- The changelog lists the features, fixes, performance changes, refactors, reverts and docs.
  `build`, `ci`, `test`, `style` and `chore` commits stay out of it.

## Daily release

1. Each push to `develop` updates a release pull request, with the next version and its changelog.
2. Every morning, the daily workflow waits for the CI of that pull request, which it tries to approve when GitHub holds it, then merges it.
3. The merge tags the version, and publishes a GitHub release with the standalone build attached.
4. The production deploy that follows ships it.

When a release cannot be made, the workflow says why, the deploy goes on, and the next morning tries again.

## Standalone build

Each release attaches `issoufi.fr-vX.Y.Z.zip`: the code of the site in one `index.html`, next to its images and CVs.

- It opens from the disk with a double click, with no server, and works offline.
- `pnpm build:standalone` builds it from the production config, with a hash router and relative URLs.
- The production build does not depend on it.
- Write each URL of a file of `public/` as one whole string, so that this build can rewrite it.
