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

**Routing** (`src/App/App.tsx`): flat BrowserRouter setup with three routes — `/` (Home), `/projects`, `/experiences`. No NotFound route is registered (404 page exists but is unused in routing).

**Component conventions**: every component folder contains three files:

- `ComponentName.tsx` — component logic
- `ComponentName.styled.ts` — styled-components styles
- `index.ts` — re-export

**Static data**: page-level data lives in `.data/*.json` files inside the page directory (e.g. `src/pages/Projects/.data/freelance-projects.json`).

**Assets**:

- Background images are served from `public/` and referenced with absolute paths (e.g. `'/projects.jpeg'`)
- SVGs are imported as React components via `vite-plugin-svgr`
- Lottie animations use JSON files co-located with the component

**Tests**: Vitest + Testing Library. Test files are `*.spec.jsx`, co-located with their component. Setup file at `src/setupTests.ts` extends Vitest with `@testing-library/jest-dom`. Components that need routing must be wrapped with `<BrowserRouter>` in tests.

## Conventions

- **Commits**: Conventional Commits enforced via commitlint + husky (`feat:`, `fix:`, `refactor:`, etc.)
- **Formatting**: Prettier runs automatically on staged files via lint-staged — no manual formatting needed
