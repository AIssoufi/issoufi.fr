# Conventions

The agents read these rules, one line each, in [`CLAUDE.md`](../CLAUDE.md).

## Git

- `main` is production, `develop` the integration branch. Both accept pull requests only, but for the daily deploy to `main`.
- One branch per ticket, named after it (`ISF-35`), in its own worktree.
- Its pull request targets `develop` and says `Closes #35`.
- A ticket branch takes the new commits of `develop` with a rebase, never a merge, so that only `develop` and `main` get merge commits.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
  Use `feat` and `fix` only for what a visitor notices: they fill the changelog.
- Every commit names its ticket in a `Refs: ISF-35` footer, which the autolink of the repository turns into a link, so that `git log` and `git blame` lead to the reason for a change.
  Only the commits of release-please and Dependabot, and merge commits, go without it.

## Workflows

- Every `actions/checkout` step of `.github/` sets `persist-credentials: false`: otherwise the checkout keeps the token of its job, or its SSH key, in the git config, where every later step of the job can read it, a third-party action or a package script included.
  Only a checkout whose credentials a later step uses to fetch or push with git keeps them, with `persist-credentials: true` and a comment on that line or right above it that names that step, as the `check` and `promote` jobs of `deploy-production.yml` do.
  The `workflows` job of the CI fails on a checkout that does neither; run `node scripts/ci/check-checkout-credentials.mjs` to check it locally.

## Code

- Code, comments and docs are in English. Only the texts of the site are translated.
- No text that a visitor reads, the CV included, holds an em dash (U+2014): a period takes an en dash, a pause a comma.
  `src/visibleTexts.spec.ts` and `pnpm cv` fail on one.
- Prettier wraps the code at 100 characters but never a comment: ESLint refuses a comment line wider than that.
- One folder per component: `Name.tsx` with its JSDoc, `Name.spec.jsx`, `Name.styled.ts` and `index.ts`. The root `App` has no `index.ts`: the entry points import `App/App.tsx`.
- A sub-component nests in the folder of its parent. A component shared by pages goes in `src/components/`.
- A style file is imported by its own component only.
- A relative import names its file with its extension (`./utils.ts`, `./List/index.ts`): Node.js loads the Vite configs as they are, and resolves no other path. ESLint refuses one without it.
- Props are optional, and a missing one never crashes.
- A meaningful number is a named constant with its unit. A computation is a pure helper, an effect a hook, each with its tests.
- Nothing stays that the site does not use: a file that no entry point reaches goes, and so does an export that no other module imports, or it loses its `export`, unless it is a type that its own file uses, such as one that an exported type names.
  `pnpm knip`, which the lint job of the CI runs, lists them with the unused dependencies. Its plugins find the entry points in the configs of Vite, Vitest and Playwright, the scripts of `package.json` and the workflows; [`knip.jsonc`](../knip.jsonc) adds the others, each with its reason.

## Styles

- Styles use styled-components through xstyled, imported from `@xstyled/styled-components` only.
- Every color, length, duration and breakpoint comes from the design tokens of `src/theme`.
  A test fails on a raw value in a style file, so the theme stays the single source of the design.
- From the `wide` breakpoint, 1600 px, the layout widens. A component that should grow with it adds a step for it.
- Hover effects apply with a mouse only, so that a tap leaves none behind.
- Every control offers a finger a target of 44 px.
- The language toggle follows the bar of the header up to 1024 px, and floats on the right edge past it: floating over the narrow gutter of a tablet, it covers the buttons of the cards under it.
- No text is under 12 px.

## Accessibility

- Each page has one `<main>` and one `h1`, and its headings skip no level.
- Lists use the shared `List` component: Safari stops reading a list without bullets as a list.
- A link that opens a new tab uses `NewTabLink`, which tells screen readers.
- A text for screen readers only uses `VisuallyHidden`; a decoration drawn with a character is hidden from them.
- A text in another language than the page gets its `lang`.
- Texts reach the WCAG AA contrast. An accent text uses the light pink, never the plum.
- With reduced motion, nothing moves: `GlobalStyle` makes every transition instant, and a change of size or place that would still jump, such as a button, a link of the header or the logo growing under the pointer, or a job card rising, sits in a block of `FULL_MOTION_QUERY`. In forced colors mode, active states stay visible, and so do the icons: that mode keeps the colors of an SVG, so an icon sets no stroke color of its own, and `GlobalStyle` draws its strokes in the text color of the palette of that mode.
