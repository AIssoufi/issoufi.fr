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

**Routing** (`src/App/App.tsx`): flat BrowserRouter setup with three routes — `/` (Home), `/projects`, `/experiences` — and a `*` catch-all rendering the NotFound page at the requested URL, without redirecting. A Forbidden page (403) exists for content the visitor may not access. Each route also needs an entry in `PAGES` (`src/utils/pages.ts`), which drives its metadata and the HTML file generated for it at build time.

**Component conventions**: every component lives in its own folder named after it:

- `ComponentName.tsx` — the component, with JSDoc on the component and on every prop
- `ComponentName.spec.jsx` — its tests, **required** for every component, at least a render without props
- `ComponentName.styled.ts` — styled-components styles, when it has any (not documented with JSDoc)
- `index.ts` — re-export

Sub-components get the same structure in their own folder inside their parent's folder. A component shared by several sub-components of a parent sits at the root of that parent's folder. Components shared across pages live in `src/components/` (e.g. `StatusMessage`). Props are optional by default, and components must render without crashing when a prop is missing.

**Static data**: page-level data lives in `.data/*.json` files inside the page directory (e.g. `src/pages/Projects/.data/freelance-projects.json`).

**Assets**:

- Background images are served from `public/` and referenced with absolute paths (e.g. `'/projects.jpeg'`)
- SVGs are imported as React components via `vite-plugin-svgr`
- Lottie animations use JSON files co-located with the component

**Tests**: Vitest + Testing Library. Test files are `*.spec.jsx`, co-located with their component. Setup file at `src/setupTests.ts` extends Vitest with `@testing-library/jest-dom`. Components that need routing must be wrapped with `<BrowserRouter>` in tests.

## Conventions

- **Commits**: Conventional Commits enforced via commitlint + husky (`feat:`, `fix:`, `refactor:`, etc.)
- **Formatting**: Prettier runs automatically on staged files via lint-staged — no manual formatting needed
