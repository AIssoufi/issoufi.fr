# 0010. Read the styles from xstyled design tokens

- Date: 2026-10-17
- Status: Accepted

## Context

Since [0005](0005-styled-components.md), each component held its styles in its `Name.styled.ts`, with the values written by hand: colors, spacings, font sizes, radii, shadows, durations, z-indexes and breakpoints. A global `index.css` held a few CSS custom properties. Nothing listed the values in use nor stopped a new one that was almost an existing one.

## Decision

Two pull requests, merged on 2026-10-17:

- [#17](https://github.com/AIssoufi/issoufi.fr/pull/17) adds `src/theme/`: primitive scales in `tokens.ts` and semantic tokens in `theme.ts`, named after the conventions of xstyled (`colors` with `-aNN` alpha variants, `space`, `fontSizes`, `radii`, `shadows`, `zIndices`, `durations`, `timingFunctions`, `screens`). The 18 style files and the global styles read them with the `th` helpers of `@xstyled/styled-components`, 496 calls; `index.css` becomes a `GlobalStyle`. `theme.spec.jsx` fails when a style file reads a token that does not exist.
- [#28](https://github.com/AIssoufi/issoufi.fr/pull/28) imports `styled`, `css`, `keyframes` and the rest from `@xstyled/styled-components` only, which re-exports styled-components, and `theme.spec.jsx` fails on a direct import of `styled-components`.

Both compared the computed styles of every element and pseudo-element of four pages, at 1680 and 700 px wide, before and after: no difference.

## Alternatives considered

The pull requests record no alternative. The ones open then:

- **CSS custom properties**, as `index.css` had: no import, but a typo in a name gives an empty value with no error, and a breakpoint cannot be one in a media query.
- **A theme object of styled-components, without xstyled**: the same tokens, read through `props.theme` in each rule, without the scales nor the `th` helpers that resolve them.

## Consequences

Measured on 2026-10-20 in a detached worktree of each commit, with Node.js 24.22.0 and `pnpm install --frozen-lockfile`. The build time is the median of three runs of `pnpm build` after deleting `dist/`. Sizes are the sums of the JavaScript and CSS files of `dist/`, gzipped.

| Figure                              | Before (`10afee5`) | After #17 (`e65876f`) | After #28 (`9fe6262`) |
| ----------------------------------- | ------------------ | --------------------- | --------------------- |
| Build time                          | 4.03 s             | 4.12 s                | 3.81 s                |
| JavaScript, gzip                    | 205.1 kB           | 218.6 kB              | 224.2 kB              |
| CSS, gzip                           | 0.7 kB             | 0                     | 0                     |
| Unit tests (from the pull requests) | 104 (#16)          | 219                   | 220                   |

- #17 also moves logic of the pages to tested hooks and helpers, so its 13.5 kB of JavaScript are not xstyled alone. #28 adds 5.6 kB gzipped, the CSS value transform of xstyled, which its description gives as 5 kB.
- The theme is the one source of the design values. Since then, `theme.spec.jsx` has grown to fail on a raw length, color or duration in a style file, and a new value goes into a scale of `tokens.ts` ([Conventions](../conventions.md)).
- #28 left the split of the bundle per route to [#27](https://github.com/AIssoufi/issoufi.fr/issues/27), closed on 2026-10-18.
