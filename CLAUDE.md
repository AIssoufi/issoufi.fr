# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm build        # Type-check + production build (tsc && vite build)
pnpm preview      # Preview production build
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
```

There is no lint command — formatting is handled automatically by Prettier via lint-staged on commit.

## Architecture

Personal portfolio SPA built with React 19 + TypeScript + Vite.

**Entry point**: `src/index.tsx` mounts to the `#welcome` DOM element.

**Routing** (`src/App/App.tsx`): flat BrowserRouter setup with three routes — `/` (Home), `/projects`, `/experiences` — and a `*` catch-all rendering the NotFound page at the requested URL, without redirecting. A Forbidden page (403) exists for content the visitor may not access. Each route also needs an entry in `PAGES` (`src/utils/pages.ts`), which drives its metadata and the HTML file generated for it at build time. This is required: the build also emits a `404.html`, which turns off Cloudflare's single-page-app fallback, so a route without its own HTML file would return a 404 on reload.

**Component conventions**: every component lives in its own folder named after it:

- `ComponentName.tsx` — the component, with JSDoc on the component and on every prop
- `ComponentName.spec.jsx` — its tests, **required** for every component, at least a render without props
- `ComponentName.styled.ts` — styled-components styles, when it has any (not documented with JSDoc)
- `index.ts` — re-export

Sub-components get the same structure in their own folder inside their parent's folder. A component shared by several sub-components of a parent sits at the root of that parent's folder. Components shared across pages live in `src/components/` (e.g. `StatusMessage`). Props are optional by default, and components must render without crashing when a prop is missing.

**Styling and design tokens**: `src/theme/tokens.ts` holds the primitive scales (palette, spacing, font sizes…) and `src/theme/theme.ts` the semantic tokens, following the xstyled theme conventions (`colors` with `-aNN` alpha variants, `space`, `fontSizes`, `radii`, `shadows`, `zIndices`, `durations`, `timingFunctions`, `screens`…). Import `styled`, `css`, `keyframes`, `createGlobalStyle`, `ThemeProvider` and `th` from `@xstyled/styled-components` only, never from `styled-components` directly (a test enforces it). Styled-components read the tokens with the `th` helpers (`th.color('accent-a55')`, `th.space(16)`, `th.radius('md')`, `th('screens.tablet')`); color names are type-checked, and `src/theme/theme.spec.jsx` checks that every token used in a style file exists. JavaScript code (canvas, inline styles) imports `theme` directly. `App` provides the `ThemeProvider` and `GlobalStyle` (which replaced `index.css`). Never write a raw color, spacing, font size, radius, shadow, duration, z-index or breakpoint in a style file: look for an existing token first, then add one to the right scale.

**Logic, constants and hooks**: magic numbers are named constants with their unit (`constants.ts` next to their users), computations are pure helpers in `utils.ts` with tests, and stateful effects are hooks in `hooks/useThing/` with tests (see `src/pages/Home/hooks`).

**Static data**: page-level data lives in `.data/*.json` files inside the page directory (e.g. `src/pages/Projects/.data/freelance-projects.json`).

**Assets**:

- Background images are served from `public/` and referenced with absolute paths (e.g. `'/projects.jpeg'`)
- SVGs are imported as React components via `vite-plugin-svgr`
- Lottie animations use JSON files co-located with the component

**Tests**: Vitest + Testing Library. Test files are `*.spec.jsx`, co-located with their component. Setup file at `src/setupTests.ts` extends Vitest with `@testing-library/jest-dom`. Components that need routing must be wrapped with `<BrowserRouter>` in tests.

## Conventions

- **Commits**: Conventional Commits enforced via commitlint + husky (`feat:`, `fix:`, `refactor:`, etc.)
- **Formatting**: Prettier runs automatically on staged files via lint-staged — no manual formatting needed
