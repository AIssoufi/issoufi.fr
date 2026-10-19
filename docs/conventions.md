# Conventions

The agents read these rules, one line each, in [`CLAUDE.md`](../CLAUDE.md).

## Git

- `main` is production, `develop` the integration branch. Both accept pull requests only, but for the daily deploy to `main`.
- One branch per ticket, named after it (`ISF-35`), in its own worktree.
- Its pull request targets `develop` and says `Closes #35`.
- A ticket branch takes the new commits of `develop` with a rebase, never a merge, so that only `develop` and `main` get merge commits.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
  Use `feat` and `fix` only for what a visitor notices: they fill the changelog.

## Code

- Code, comments and docs are in English. Only the texts of the site are translated.
- One folder per component: `Name.tsx` with its JSDoc, `Name.spec.jsx`, `Name.styled.ts` and `index.ts`.
- A sub-component nests in the folder of its parent. A component shared by pages goes in `src/components/`.
- A style file is imported by its own component only.
- A relative import names its file with its extension (`./utils.ts`, `./List/index.ts`): Node.js loads the Vite configs as they are, and resolves no other path. ESLint refuses one without it.
- Props are optional, and a missing one never crashes.
- A meaningful number is a named constant with its unit. A computation is a pure helper, an effect a hook, each with its tests.

## Styles

- Styles use styled-components through xstyled, imported from `@xstyled/styled-components` only.
- Every color, length, duration and breakpoint comes from the design tokens of `src/theme`.
  A test fails on a raw value in a style file, so the theme stays the single source of the design.
- From the `wide` breakpoint, 1600 px, the layout widens. A component that should grow with it adds a step for it.
- Hover effects apply with a mouse only, so that a tap leaves none behind.
- Every control offers a finger a target of 44 px.
- No text is under 12 px.

## Accessibility

- Each page has one `<main>` and one `h1`, and its headings skip no level.
- Lists use the shared `List` component: Safari stops reading a list without bullets as a list.
- A link that opens a new tab uses `NewTabLink`, which tells screen readers.
- A text for screen readers only uses `VisuallyHidden`; a decoration drawn with a character is hidden from them.
- A text in another language than the page gets its `lang`.
- Texts reach the WCAG AA contrast. An accent text uses the light pink, never the plum.
- With reduced motion, nothing moves. In forced colors mode, active states stay visible, and so do the icons: that mode keeps the colors of an SVG, so an icon sets no stroke color of its own, and `GlobalStyle` draws its strokes in the text color of the palette of that mode.
