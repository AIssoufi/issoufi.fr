# issoufi-v3

> Personal portfolio of **ADAM Issoufi** — Full-stack JavaScript developer with a passion for UX and UI Design. Live at [issoufi.fr](https://issoufi.fr/).

## 🛠 Tech Stack

| Category            | Technologies                    |
| ------------------- | ------------------------------- |
| **Framework**       | React 19                        |
| **Build**           | Vite 6                          |
| **Language**        | TypeScript 5                    |
| **Styling**         | styled-components 6 + xstyled 4 |
| **Routing**         | React Router 7                  |
| **i18n**            | i18next (French and English)    |
| **Tests**           | Vitest 3 + Testing Library      |
| **Package Manager** | pnpm                            |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24 (see `.nvmrc`)
- [pnpm](https://pnpm.io/)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Production

```bash
pnpm build     # Type-check, then build to dist/
pnpm preview   # Serve the production build locally
```

### Tests

```bash
pnpm test          # Single run
pnpm test:watch    # Watch mode
```

Tests are `*.spec.jsx` / `*.spec.ts` files next to the code they test. Every component has one.

## 🌐 Deployment

The site is deployed on [Cloudflare Pages](https://pages.cloudflare.com/) at [issoufi.fr](https://issoufi.fr/). Every push to `main` deploys to production. Other branches get a preview deployment.

| Setting                | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| Production branch      | `main`                                                         |
| Framework preset       | None                                                           |
| Root directory         | `/` (default)                                                  |
| Build command          | `pnpm build`                                                   |
| Build output directory | `dist`                                                         |
| Node.js version        | `24`, read from `.nvmrc`                                       |
| Package manager        | pnpm, detected from `pnpm-lock.yaml`                           |
| Environment variables  | `PNPM_VERSION=10.34.7` (same major version as the CI, pnpm 10) |

- **One HTML file per page**: at build time, a Vite plugin (`vite.config.ts`) fills the `%PAGE_*%` placeholders of `index.html` and emits `projects.html` and `experiences.html` from the same template. Each page gets its own title, description and canonical URL, taken from the `meta` translations of `src/i18n/fr.ts`, so link previews and search engines get them without running JavaScript. Cloudflare Pages serves these files at `/projects` and `/experiences`. A new route needs an entry in `PAGES` (`src/utils/pages.ts`).
- **Not found pages**: the plugin also emits `404.html`, with the "page not found" title and a `noindex` tag. Cloudflare Pages serves it with a real `404` status for any path that matches no file. The URL is kept, with no redirect, and the app shows its NotFound page. Because `404.html` exists, Cloudflare's single-page-app fallback is off, which is why every route needs its own HTML file.
- **Years of experience**: the number in the generated HTML files is computed at build time from `CAREER_START_DATE` (`src/utils/career.ts`), so it only changes with a new build. The app itself computes it at runtime.

## 📁 Project Structure

```
src/
├── App/                  # Root component, router and layout
│   ├── DocumentMeta/     # <html lang>, title and description per route and language
│   ├── Header/           # Logo, navigation and burger menu
│   ├── LangToggle/       # FR / EN switch
│   └── Modal/            # Informational modal (unused)
├── components/           # Components shared across pages
│   └── StatusMessage/    # Code, title, message and home link of error pages
├── i18n/                 # French and English translations
├── pages/
│   ├── Home/             # Landing page: animated title, particle background, hooks/ for effects
│   ├── Projects/         # Personal and freelance projects, data in .data/*.json
│   ├── Experiences/      # Work experience timeline
│   ├── NotFound/         # 404 page, shown at the requested URL
│   └── Forbidden/        # 403 page, not routed yet
├── theme/                # Design tokens (tokens.ts, theme.ts) and global styles
├── utils/                # Career dates and page metadata helpers
└── index.tsx             # Entry point
```

## 📝 Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) enforced via commitlint
- **Formatting**: Prettier (via lint-staged + husky)
- **Language**: code, comments and docs are in English. Only user-facing texts are translated.
- **Styles**: styled-components read every color, spacing, font, radius, shadow, duration and breakpoint from the design tokens of `src/theme` with the [xstyled](https://xstyled.dev/) `th` helpers (`th.color('accent')`, `th.space(16)`, `th.radius('md')`…). No hard-coded values, and every styled-components API is imported from `@xstyled/styled-components`.
- **Components**: one folder per component (`Name.tsx`, `Name.spec.jsx`, `Name.styled.ts`, `index.ts`), optional props that tolerate missing values, and JSDoc on every component and prop. See [`CLAUDE.md`](CLAUDE.md) for the details.
