# 0005. Style the components with styled-components

- Date: 2026-03-21
- Status: Accepted

## Context

After the move to Vite ([0003](0003-vite-and-vitest.md)), the styles lived in 13 global CSS files under `src/`, one per component or page, imported for their side effect: every class name shared one scope, and nothing tied a rule to the component that used it. styled-components 6 was already installed since `ddc2cc8` (2024-02-17), and two files used it (`*.styled.ts`). Tailwind CSS 3.4 was installed too, since `6674b92`, with its directives in `src/index.css`.

## Decision

Commit `8a7c708`, pushed to the default branch with no pull request, on 2026-03-21, moves the CSS files to styled-components: each component gets a `Name.styled.ts` next to it, and one global CSS file is left. Commit `dcffafa`, the same day, removes Tailwind, which the code no longer used.

## Alternatives considered

The commits record no alternative. The ones open then:

- **CSS Modules**, which Vite supports with no plugin: scoped class names, but the styles that depend on a prop or a state go through class names toggled by hand.
- **Tailwind CSS**, already installed: utility classes in the markup rather than styles next to the component, which `dcffafa` removes.

## Consequences

Measured on 2026-10-20 in a detached worktree of each commit, with Node.js 22.14.0 and `pnpm install --frozen-lockfile`. The build time is the median of three runs of `pnpm build` after deleting `dist/`. Sizes are the sums of the JavaScript and CSS files of `dist/`, gzipped. Files are counted with `git ls-tree -r --name-only <commit> src`.

| Figure              | Before (`6e3054c`) | After (`8a7c708`) |
| ------------------- | ------------------ | ----------------- |
| CSS files in `src/` | 13                 | 1                 |
| `*.styled.ts` files | 2                  | 14                |
| Build time          | 2.63 s             | 2.95 s            |
| JavaScript, gzip    | 175.1 kB           | 178.1 kB          |
| CSS, gzip           | 3.1 kB             | 0.65 kB           |

- The styles move from the CSS file into the JavaScript: the CSS shrinks by 2.5 kB gzipped and the JavaScript grows by 3.0 kB.
- The browser inserts the styles when the components render, so a page shows no style before its script runs. Rendering the pages at build time ([0015](0015-render-at-build-time.md)) writes the styles of each page into its HTML file.
- The styles become TypeScript, which later reads the values of a theme: [0010](0010-xstyled-design-tokens.md).
